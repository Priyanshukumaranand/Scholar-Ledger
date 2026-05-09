// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IssuerRegistry
 * @notice Self-registration registry for issuing institutions.
 *         Anyone can register or update their own profile (msg.sender owns it).
 *         A separate AccreditationRegistry decides which entries are "trusted".
 *         The frontend resolves credentials' issuer addresses through this
 *         registry to display human-readable institution metadata.
 */
contract IssuerRegistry {

    struct Institution {
        string  name;          // "Indian Institute of Technology Delhi"
        string  shortName;     // "IIT Delhi"
        string  country;       // ISO 3166-1 alpha-2: "IN"
        string  websiteUrl;
        string  logoCID;       // IPFS CID of logo image
        uint256 registeredAt;
        uint256 updatedAt;
        bool    exists;
    }

    mapping(address => Institution) private institutions;
    address[] private institutionList;

    event InstitutionRegistered(address indexed wallet, string name);
    event InstitutionUpdated(address indexed wallet, string name);

    function registerInstitution(
        string calldata name,
        string calldata shortName,
        string calldata country,
        string calldata websiteUrl,
        string calldata logoCID
    ) external {
        require(bytes(name).length > 0, "Name required");
        require(!institutions[msg.sender].exists, "Already registered");

        institutions[msg.sender] = Institution({
            name: name,
            shortName: shortName,
            country: country,
            websiteUrl: websiteUrl,
            logoCID: logoCID,
            registeredAt: block.timestamp,
            updatedAt: block.timestamp,
            exists: true
        });
        institutionList.push(msg.sender);
        emit InstitutionRegistered(msg.sender, name);
    }

    function updateInstitution(
        string calldata name,
        string calldata shortName,
        string calldata country,
        string calldata websiteUrl,
        string calldata logoCID
    ) external {
        Institution storage inst = institutions[msg.sender];
        require(inst.exists, "Not registered");
        require(bytes(name).length > 0, "Name required");

        inst.name = name;
        inst.shortName = shortName;
        inst.country = country;
        inst.websiteUrl = websiteUrl;
        inst.logoCID = logoCID;
        inst.updatedAt = block.timestamp;
        emit InstitutionUpdated(msg.sender, name);
    }

    function getInstitution(address wallet)
        external
        view
        returns (
            string memory name,
            string memory shortName,
            string memory country,
            string memory websiteUrl,
            string memory logoCID,
            uint256 registeredAt,
            uint256 updatedAt,
            bool exists
        )
    {
        Institution memory inst = institutions[wallet];
        return (
            inst.name,
            inst.shortName,
            inst.country,
            inst.websiteUrl,
            inst.logoCID,
            inst.registeredAt,
            inst.updatedAt,
            inst.exists
        );
    }

    function isRegistered(address wallet) external view returns (bool) {
        return institutions[wallet].exists;
    }

    function getInstitutionCount() external view returns (uint256) {
        return institutionList.length;
    }

    function getInstitutionByIndex(uint256 index) external view returns (address) {
        require(index < institutionList.length, "Invalid index");
        return institutionList[index];
    }
}
