// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title IdentityAnchor - Minimal anchoring contract for credential hashes
contract IdentityAnchor {
    mapping(bytes32 => bool) private stored;

    event Stored(bytes32 indexed hash, address indexed sender);

    /// @notice Store a credential hash on-chain
    /// @param h The SHA-256 digest to store
    function store(bytes32 h) external {
        stored[h] = true;
        emit Stored(h, msg.sender);
    }

    /// @notice Check if a hash already exists
    /// @param h The hash to query
    /// @return bool True if stored
    function exists(bytes32 h) external view returns (bool) {
        return stored[h];
    }
}
