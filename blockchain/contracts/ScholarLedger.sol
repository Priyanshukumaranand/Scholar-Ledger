// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ScholarLedger {

    /* ========== ROLES ========== */

    address public universityAdmin;

    modifier onlyAdmin() {
        require(msg.sender == universityAdmin, "Only admin allowed");
        _;
    }

    /* ========== DATA STRUCTURES ========== */

    struct Credential {
        bytes32 cidHash;        // keccak256(IPFS CID) — used for cryptographic verification
        string cid;             // original IPFS CID — used for document retrieval & display
        string title;           // e.g. "BTech Semester 6"
        uint256 issuedOn;
        bool revoked;
        address issuer;
    }

    // student address => credentials
    mapping(address => Credential[]) private studentCredentials;

    // Track issued hashes per student to prevent duplicates
    mapping(address => mapping(bytes32 => bool)) private cidHashIssued;

    /* ========== EVENTS ========== */

    event CredentialIssued(
        address indexed student,
        uint256 indexed index,
        bytes32 cidHash,
        string title
    );

    event CredentialRevoked(
        address indexed student,
        uint256 indexed index
    );

    event AdminTransferred(
        address indexed previousAdmin,
        address indexed newAdmin
    );

    /* ========== CONSTRUCTOR ========== */

    constructor() {
        universityAdmin = msg.sender;
    }

    /* ========== ADMIN MANAGEMENT ========== */

    function transferAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "New admin cannot be zero address");
        require(newAdmin != universityAdmin, "Already the admin");
        emit AdminTransferred(universityAdmin, newAdmin);
        universityAdmin = newAdmin;
    }

    /* ========== ADMIN FUNCTIONS ========== */

    function issueCredential(
        address student,
        bytes32 cidHash,
        string calldata cid,
        string calldata title
    ) external onlyAdmin {
        require(student != address(0), "Invalid student address");
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
            title
        );
    }

    function revokeCredential(
        address student,
        uint256 index
    ) external onlyAdmin {
        require(index < studentCredentials[student].length, "Invalid index");
        require(!studentCredentials[student][index].revoked, "Already revoked");

        studentCredentials[student][index].revoked = true;

        emit CredentialRevoked(student, index);
    }

    /* ========== READ FUNCTIONS (FOR UI) ========== */

    function getCredentialCount(address student)
        external
        view
        returns (uint256)
    {
        return studentCredentials[student].length;
    }

    function getCredential(
        address student,
        uint256 index
    )
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

        return (
            c.cidHash,
            c.cid,
            c.title,
            c.issuedOn,
            c.revoked,
            c.issuer
        );
    }

    function verifyCredential(
        address student,
        bytes32 cidHash
    )
        external
        view
        returns (bool)
    {
        Credential[] memory creds = studentCredentials[student];

        for (uint256 i = 0; i < creds.length; i++) {
            if (creds[i].cidHash == cidHash && !creds[i].revoked) {
                return true;
            }
        }
        return false;
    }
}
