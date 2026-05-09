// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AccreditationRegistry
 * @notice A governance-controlled list of accredited issuer addresses.
 *         The deploying account is the initial accreditationAuthority — in a
 *         real-world deployment this would be a govt body (UGC, AICTE, etc.)
 *         The registry maps an issuer address to the bodies that have
 *         accredited it (e.g., "UGC", "AICTE", "NAAC A++").
 */
contract AccreditationRegistry {

    address public accreditationAuthority;

    // issuer => list of accreditation labels granted
    mapping(address => string[]) private accreditations;
    // issuer => label => exists (for dedupe)
    mapping(address => mapping(string => bool)) private hasAccreditation;
    // issuer => is currently accredited by anything?
    mapping(address => bool) public isAccredited;

    modifier onlyAuthority() {
        require(msg.sender == accreditationAuthority, "Only accreditation authority");
        _;
    }

    event Accredited(address indexed issuer, string label, address indexed by);
    event AccreditationRemoved(address indexed issuer, string label, address indexed by);
    event AuthorityTransferred(address indexed previousAuthority, address indexed newAuthority);

    constructor() {
        accreditationAuthority = msg.sender;
        emit AuthorityTransferred(address(0), msg.sender);
    }

    function transferAuthority(address newAuthority) external onlyAuthority {
        require(newAuthority != address(0), "Zero address");
        require(newAuthority != accreditationAuthority, "Already authority");
        address prev = accreditationAuthority;
        accreditationAuthority = newAuthority;
        emit AuthorityTransferred(prev, newAuthority);
    }

    function accredit(address issuer, string calldata label) external onlyAuthority {
        require(issuer != address(0), "Zero address");
        require(bytes(label).length > 0, "Empty label");
        require(!hasAccreditation[issuer][label], "Already accredited with this label");

        accreditations[issuer].push(label);
        hasAccreditation[issuer][label] = true;
        isAccredited[issuer] = true;
        emit Accredited(issuer, label, msg.sender);
    }

    function removeAccreditation(address issuer, string calldata label) external onlyAuthority {
        require(hasAccreditation[issuer][label], "Not accredited with this label");
        hasAccreditation[issuer][label] = false;

        // Remove label from array
        string[] storage labels = accreditations[issuer];
        bytes32 target = keccak256(bytes(label));
        for (uint256 i = 0; i < labels.length; i++) {
            if (keccak256(bytes(labels[i])) == target) {
                labels[i] = labels[labels.length - 1];
                labels.pop();
                break;
            }
        }

        if (labels.length == 0) {
            isAccredited[issuer] = false;
        }
        emit AccreditationRemoved(issuer, label, msg.sender);
    }

    function getAccreditations(address issuer) external view returns (string[] memory) {
        return accreditations[issuer];
    }

    function getAccreditationCount(address issuer) external view returns (uint256) {
        return accreditations[issuer].length;
    }
}
