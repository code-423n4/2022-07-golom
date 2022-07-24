/// [MIT License]

pragma solidity 0.8.11;

/// @title Base64
/// @notice Provides a function for encoding some bytes in base64
/// @author Brecht Devos <brecht@loopring.org>
library Base64 {
    bytes internal constant TABLE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

    /// @notice Encodes some bytes to the base64 representation
    function encode(bytes memory data) internal pure returns (string memory) {
        uint256 len = data.length;
        if (len == 0) return '';

        // multiply by 4/3 rounded up
        uint256 encodedLen = 4 * ((len + 2) / 3);

        // Add some extra buffer at the end
        bytes memory result = new bytes(encodedLen + 32);

        bytes memory table = TABLE;

        assembly {
            let tablePtr := add(table, 1)
            let resultPtr := add(result, 32)

            for {
                let i := 0
            } lt(i, len) {

            } {
                i := add(i, 3)
                let input := and(mload(add(data, i)), 0xffffff)

                let out := mload(add(tablePtr, and(shr(18, input), 0x3F)))
                out := shl(8, out)
                out := add(out, and(mload(add(tablePtr, and(shr(12, input), 0x3F))), 0xFF))
                out := shl(8, out)
                out := add(out, and(mload(add(tablePtr, and(shr(6, input), 0x3F))), 0xFF))
                out := shl(8, out)
                out := add(out, and(mload(add(tablePtr, and(input, 0x3F))), 0xFF))
                out := shl(224, out)

                mstore(resultPtr, out)

                resultPtr := add(resultPtr, 4)
            }

            switch mod(len, 3)
            case 1 {
                mstore(sub(resultPtr, 2), shl(240, 0x3d3d))
            }
            case 2 {
                mstore(sub(resultPtr, 1), shl(248, 0x3d))
            }

            mstore(result, encodedLen)
        }

        return string(result);
    }
}

library TokenUriHelper {
    function _tokenURI(
        uint256 _tokenId,
        uint256 _balanceOf,
        uint256 _locked_end,
        uint256 _value
    ) public pure returns (string memory output) {
        output = '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="468" viewBox="0 0 512 468" fill="none"><g clip-path="url(#clip0_2_190)"><rect width="512" height="468" rx="40" fill="#232323"/><g filter="url(#filter0_f_2_190)"><ellipse cx="256.5" cy="-132" rx="164" ry="381.5" transform="rotate(-90 256.5 -132)" fill="#FF8982"/></g>';
        output = string(
            abi.encodePacked(
                output,
                '<text y="128px" x="60px" fill="white" font-family="Lexend Deca, sans-serif" font-weight="400" font-size="64px">#',
                toString(_tokenId),
                '</text><text y="318px" x="54px" fill="white" font-family="Lexend Deca, sans-serif" font-weight="400" font-size="24px" fill-opacity="0.64">Locked Till</text>'
            )
        );
        output = string(
            abi.encodePacked(
                output,
                '<text y="320px" x="445px" fill="white" font-family="Lexend Deca, sans-serif" font-weight="400" font-size="24px" text-anchor="end">',
                toString(_locked_end),
                '</text><text y="248px" x="54px" fill="white" font-family="Lexend Deca, sans-serif" font-weight="400" font-size="24px" fill-opacity="0.64">Voting Power</text>'
            )
        );
        output = string(
            abi.encodePacked(
                output,
                '<text y="248px" x="445px" fill="white" font-family="Lexend Deca, sans-serif" font-weight="400" font-size="24px" text-anchor="end">',
                toString(_balanceOf),
                '</text><text y="391px" x="54px" fill="white" font-family="Lexend Deca, sans-serif" font-weight="400" font-size="24px" fill-opacity="0.64">Value</text>'
            )
        );
        output = string(
            abi.encodePacked(
                output,
                '<text y="392px" x="447px" fill="white" font-family="Lexend Deca, sans-serif" font-weight="400" font-size="24px" text-anchor="end">',
                toString(_value),
                '</text><mask id="mask0_2_190" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="399" y="73" width="58" height="58"><path d="M456.543 102.091C456.543 117.884 443.74 130.686 427.948 130.686C412.155 130.686 399.352 117.884 399.352 102.091C399.352 86.2981 412.155 73.4955 427.948 73.4955C443.74 73.4955 456.543 86.2981 456.543 102.091ZM405.91 102.091C405.91 114.262 415.777 124.128 427.948 124.128C440.118 124.128 449.985 114.262 449.985 102.091C449.985 89.9201 440.118 80.0537 427.948 80.0537C415.777 80.0537 405.91 89.9201 405.91 102.091Z" fill="#C4C4C4"/></mask><g mask="url(#mask0_2_190)"><path d="M458.138 73.4955H396.962V133.076H458.138V73.4955Z" fill="#FD7A7A"/><path d="M396.962 76.7614H458.138" stroke="black" stroke-width="0.328567"/><path d="M396.962 80.266H458.138" stroke="black" stroke-width="0.328567"/><path d="M396.962 83.7708H458.138" stroke="black" stroke-width="0.328567"/><path d="M396.962 87.2754H458.138" stroke="black" stroke-width="0.328567"/><path d="M396.962 90.7802H458.138" stroke="black" stroke-width="0.328567"/><path d="M396.962 94.2848H458.138" stroke="black" stroke-width="0.328567"/><path d="M396.962 97.7897H458.138" stroke="black" stroke-width="0.328567"/><path d="M396.962 101.294H458.138" stroke="black" stroke-width="0.328567"/><path d="M396.962 104.799H458.138" stroke="black" stroke-width="0.328567"/><path d="M396.962 108.304H458.138" stroke="black" stroke-width="0.328567"/><path d="M396.962 111.808H458.138" stroke="black" stroke-width="0.328567"/><path d="M396.962 115.313H458.138" stroke="black" stroke-width="0.328567"/><path d="M396.962 118.818H458.138" stroke="black" stroke-width="0.328567"/><path d="M396.962 122.323H458.138" stroke="black" stroke-width="0.328567"/><path d="M396.962 125.827H458.138" stroke="black" stroke-width="0.328567"/><path d="M396.962 129.332H458.138" stroke="black" stroke-width="0.328567"/></g><mask id="mask1_2_190" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="399" y="73" width="58" height="58"><path d="M456.543 102.091C456.543 117.884 443.74 130.686 427.948 130.686C412.155 130.686 399.352 117.884 399.352 102.091C399.352 86.2981 412.155 73.4955 427.948 73.4955C443.74 73.4955 456.543 86.2981 456.543 102.091ZM405.91 102.091C405.91 114.262 415.777 124.128 427.948 124.128C440.118 124.128 449.985 114.262 449.985 102.091C449.985 89.9201 440.118 80.0537 427.948 80.0537C415.777 80.0537 405.91 89.9201 405.91 102.091Z" fill="white"/></mask><g mask="url(#mask1_2_190)"><path d="M456.543 102.091C456.543 117.884 443.74 130.686 427.948 130.686C412.155 130.686 399.352 117.884 399.352 102.091C399.352 86.2981 412.155 73.4955 427.948 73.4955C443.74 73.4955 456.543 86.2981 456.543 102.091ZM405.91 102.091C405.91 114.262 415.777 124.128 427.948 124.128C440.118 124.128 449.985 114.262 449.985 102.091C449.985 89.9201 440.118 80.0537 427.948 80.0537C415.777 80.0537 405.91 89.9201 405.91 102.091Z" stroke="black" stroke-width="0.876179"/><path d="M422.132 130.606H428.026" stroke="black" stroke-width="0.109522"/><path d="M422.132 73.5752H428.026" stroke="black" stroke-width="0.109522"/></g><mask id="mask2_2_190" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="393" y="73" width="58" height="58"><path d="M450.648 102.091C450.648 117.884 437.845 130.686 422.053 130.686C406.26 130.686 393.457 117.884 393.457 102.091C393.457 86.2981 406.26 73.4955 422.053 73.4955C437.845 73.4955 450.648 86.2981 450.648 102.091ZM400.015 102.091C400.015 114.262 409.882 124.128 422.053 124.128C434.223 124.128 444.09 114.262 444.09 102.091C444.09 89.9201 434.223 80.0537 422.053 80.0537C409.882 80.0537 400.015 89.9201 400.015 102.091Z" fill="white"/></mask><g mask="url(#mask2_2_190)"><path d="M450.648 102.091C450.648 117.884 437.845 130.686 422.053 130.686C406.26 130.686 393.457 117.884 393.457 102.091C393.457 86.2981 406.26 73.4955 422.053 73.4955C437.845 73.4955 450.648 86.2981 450.648 102.091ZM400.015 102.091C400.015 114.262 409.882 124.128 422.053 124.128C434.223 124.128 444.09 114.262 444.09 102.091C444.09 89.9201 434.223 80.0537 422.053 80.0537C409.882 80.0537 400.015 89.9201 400.015 102.091Z" fill="white" stroke="black" stroke-width="0.876179"/></g></g><defs><filter id="filter0_f_2_190" x="-381" y="-552" width="1275" height="840" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="128" result="effect1_foregroundBlur_2_190"/></filter><clipPath id="clip0_2_190"><rect width="512" height="468" rx="40" fill="white"/></clipPath></defs></svg>'
            )
        );

        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "Lock #',
                        toString(_tokenId),
                        '", "description": "Golom locks, can be used to claim protocol fees and token emission", "attributes": [{"trait_type":"Lock End","value":"',
                        toString(_locked_end),
                        '"},{"trait_type":"Power","value":"',
                        toString(_balanceOf),
                        '"},{"trait_type":"Value","value":"',
                        toString(_value),
                        '"}], "image": "data:image/svg+xml;base64,',
                        Base64.encode(bytes(output)),
                        '"}'
                    )
                )
            )
        );
        output = string(abi.encodePacked('data:application/json;base64,', json));
    }

    function toString(uint256 value) internal pure returns (string memory) {
        // Inspired by OraclizeAPI's implementation - MIT license
        // https://github.com/oraclize/ethereum-api/blob/b42146b063c7d6ee1358846c198246239e9360e8/oraclizeAPI_0.4.25.sol

        if (value == 0) {
            return '0';
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
