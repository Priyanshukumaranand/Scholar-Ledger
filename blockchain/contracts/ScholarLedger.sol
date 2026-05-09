// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ScholarLedger
 * @notice Anchors academic credentials on-chain.
 *         Role model: superAdmin (governance), ADMIN (issue + revoke + manage roles),
 *         ISSUER (issue only). Designed for a single deploying institution that may
 *         delegate issuance to multiple faculty/department wallets.
 */
contract ScholarLedger {

    /* ========== ROLES ========== */

    enum Role { NONE, ISSUER, ADMIN }

    address public superAdmin;
    mapping(address => Role) public roles;

    modifier onlySuperAdmin() {
        require(msg.sender == superAdmin, "Only super admin");
        _;
    }

    modifier onlyAdmin() {
        require(_isAdmin(msg.sender), "Not an admin");
        _;
    }

    modifier onlyIssuer() {
        require(_canIssue(msg.sender), "Not an issuer");
        _;
    }

    function _isAdmin(address user) internal view returns (bool) {
        return roles[user] == Role.ADMIN || user == superAdmin;
    }

    function _canIssue(address user) internal view returns (bool) {
        return roles[user] == Role.ISSUER || roles[user] == Role.ADMIN || user == superAdmin;
    }

    /* ========== DATA STRUCTURES ========== */

    struct Credential {
        bytes32 cidHash;        // keccak256(IPFS CID)
        string  cid;            // original IPFS CID for retrieval
        string  title;
        uint256 issuedOn;
        bool    revoked;
        address issuer;         // wallet that issued (institution wallet)
    }

    mapping(address => Credential[]) private studentCredentials;
    mapping(address => mapping(bytes32 => bool)) private cidHashIssued;

    /* ========== EVENTS ========== */

    event CredentialIssued(
        address indexed student,
        uint256 indexed index,
        bytes32 cidHash,
        string  title,
        address indexed issuer
    );
    event CredentialRevoked(
        address indexed student,
        uint256 indexed index,
        address indexed by
    );
    event RoleGranted(address indexed user, Role role, address indexed grantedBy);
    event RoleRevoked(address indexed user, address indexed revokedBy);
    event SuperAdminTransferred(address indexed previousSuper, address indexed newSuper);

    /* ========== CONSTRUCTOR ========== */

    constructor() {
        superAdmin = msg.sender;
        roles[msg.sender] = Role.ADMIN;
        emit SuperAdminTransferred(address(0), msg.sender);
        emit RoleGranted(msg.sender, Role.ADMIN, msg.sender);
    }

    /* ========== ROLE MANAGEMENT ========== */

    function grantRole(address user, Role role) external onlyAdmin {
        require(user != address(0), "Zero address");
        require(role != Role.NONE, "Use revokeRole for NONE");
        require(roles[user] != role, "User already has this role");
        roles[user] = role;
        emit RoleGranted(user, role, msg.sender);
    }

    function revokeRole(address user) external onlyAdmin {
        require(user != address(0), "Zero address");
        require(user != superAdmin, "Cannot revoke super admin role");
        require(roles[user] != Role.NONE, "User has no role");
        delete roles[user];
        emit RoleRevoked(user, msg.sender);
    }

    function transferSuperAdmin(address newSuper) external onlySuperAdmin {
        require(newSuper != address(0), "Zero address");
        require(newSuper != superAdmin, "Already super admin");
        address prev = superAdmin;
        superAdmin = newSuper;
        if (roles[newSuper] != Role.ADMIN) {
            roles[newSuper] = Role.ADMIN;
            emit RoleGranted(newSuper, Role.ADMIN, msg.sender);
        }
        emit SuperAdminTransferred(prev, newSuper);
    }

    /* ========== CREDENTIAL ISSUANCE ========== */

    function issueCredential(
        address student,
        bytes32 cidHash,
        string calldata cid,
        string calldata title
    ) external onlyIssuer {
        require(student != address(0), "Invalid student address");
        require(bytes(title).length > 0, "Empty title");
        require(!cidHashIssued[student][cidHash], "Credential already issued to this student");

        studentCredentials[student].push(
            Credential({
                cidHash: cidHash,
                cid: cid,
                title: title,
                issuedOn: block.timestamp,
                revoked: false,
                issuer: msg.sender
            })
        );

        cidHashIssued[student][cidHash] = true;

        emit CredentialIssued(
            student,
            studentCredentials[student].length - 1,
            cidHash,
            title,
            msg.sender
        );
    }

    /**
     * @notice Bulk issuance — atomic. Either all succeed or the whole batch reverts.
     *         Caller must be ISSUER or ADMIN. Each (student, cidHash, cid, title)
     *         tuple is treated as an independent issuance; duplicate-guard still applies.
     */
    function issueCredentialBatch(
        address[] calldata students,
        bytes32[] calldata cidHashes,
        string[]  calldata cids,
        string[]  calldata titles
    ) external onlyIssuer {
        uint256 n = students.length;
        require(n > 0, "Empty batch");
        require(
            cidHashes.length == n && cids.length == n && titles.length == n,
            "Length mismatch"
        );

        for (uint256 i = 0; i < n; i++) {
            address student = students[i];
            bytes32 cidHash = cidHashes[i];
            require(student != address(0), "Invalid student address");
            require(bytes(titles[i]).length > 0, "Empty title");
            require(!cidHashIssued[student][cidHash], "Duplicate in batch or already issued");

            studentCredentials[student].push(
                Credential({
                    cidHash: cidHash,
                    cid: cids[i],
                    title: titles[i],
                    issuedOn: block.timestamp,
                    revoked: false,
                    issuer: msg.sender
                })
            );
            cidHashIssued[student][cidHash] = true;

            emit CredentialIssued(
                student,
                studentCredentials[student].length - 1,
                cidHash,
                titles[i],
                msg.sender
            );
        }
    }

    function revokeCredential(address student, uint256 index) external onlyAdmin {
        require(index < studentCredentials[student].length, "Invalid index");
        require(!studentCredentials[student][index].revoked, "Already revoked");
        studentCredentials[student][index].revoked = true;
        emit CredentialRevoked(student, index, msg.sender);
    }

    /* ========== READ FUNCTIONS ========== */

    function getCredentialCount(address student) external view returns (uint256) {
        return studentCredentials[student].length;
    }

    function getCredential(address student, uint256 index)
        external
        view
        returns (
            bytes32 cidHash,
            string memory cid,
            string memory title,
            uint256 issuedOn,
            bool revoked,
            address issuer
        )
    {
        require(index < studentCredentials[student].length, "Invalid index");
        Credential memory c = studentCredentials[student][index];
        return (c.cidHash, c.cid, c.title, c.issuedOn, c.revoked, c.issuer);
    }

    function verifyCredential(address student, bytes32 cidHash) external view returns (bool) {
        Credential[] memory creds = studentCredentials[student];
        for (uint256 i = 0; i < creds.length; i++) {
            if (creds[i].cidHash == cidHash && !creds[i].revoked) return true;
        }
        return false;
    }

    /* ========== ROLE QUERIES (helpers for frontend) ========== */

    function canIssue(address user) external view returns (bool) {
        return _canIssue(user);
    }

    function isAdmin(address user) external view returns (bool) {
        return _isAdmin(user);
    }
}
