// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title StudentProfileRegistry
 * @notice Stores a per-student IPFS CID that points to a student-controlled
 *         JSON profile (name, photo, email, etc). Only the student themselves
 *         can set their own profile pointer. They can also clear it (GDPR).
 *         No personal data is on-chain — only the CID.
 */
contract StudentProfileRegistry {

    mapping(address => string)  private profileCID;
    mapping(address => uint256) private updatedAt;

    event ProfileUpdated(address indexed student, string cid);
    event ProfileCleared(address indexed student);

    function setProfile(string calldata cid) external {
        require(bytes(cid).length > 0, "Empty CID");
        profileCID[msg.sender] = cid;
        updatedAt[msg.sender] = block.timestamp;
        emit ProfileUpdated(msg.sender, cid);
    }

    function clearProfile() external {
        require(bytes(profileCID[msg.sender]).length > 0, "No profile to clear");
        delete profileCID[msg.sender];
        updatedAt[msg.sender] = block.timestamp;
        emit ProfileCleared(msg.sender);
    }

    function getProfileCID(address student) external view returns (string memory) {
        return profileCID[student];
    }

    function getProfileMeta(address student)
        external
        view
        returns (string memory cid, uint256 lastUpdated)
    {
        return (profileCID[student], updatedAt[student]);
    }

    function hasProfile(address student) external view returns (bool) {
        return bytes(profileCID[student]).length > 0;
    }
}
