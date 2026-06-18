// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract IdentityAnchor {
    mapping(bytes32 => bool) private stored;
    mapping(bytes32 => bool) private revoked;

    event Stored(bytes32 indexed hash, address indexed sender);
    event Revoked(bytes32 indexed hash, address indexed sender);

    function store(bytes32 h) external {
        stored[h] = true;
        emit Stored(h, msg.sender);
    }

    function revoke(bytes32 h) external {
        require(stored[h], "hash not stored");
        revoked[h] = true;
        emit Revoked(h, msg.sender);
    }

    function exists(bytes32 h) external view returns (bool) {
        return stored[h] && !revoked[h];
    }

    function isRevoked(bytes32 h) external view returns (bool) {
        return revoked[h];
    }

    function isStored(bytes32 h) external view returns (bool) {
        return stored[h];
    }
}
