import axios from "axios";
const supportedAssets = {
  137: {
    push: "0x58001cc1a9e17a20935079ab40b1b8f4fc19efd1",
    ud: "0xa9a6A3626993D487d2Dbda3173cf58cA1a9D9e9f",
  },
  1: {
    push: "0xf418588522d5dd018b425e472991e52ebbeeeeee",
    ud: "0x6e7a5fafcec6bb1e78bae2a1f0b612012bf14827",
  },
};

export function truncateAddress(input) {
  if (input.length <= 5) {
    return input;
  } else {
    return input.substring(0, 5) + "...." + input.substring(input.length - 5);
  }
}

export function getContractAddress(name, chainID) {
  console.log("getContractAddress", name, chainID);
  if (chainID === undefined) return undefined;
  return supportedAssets[chainID][name];
}

export const balanceABI = [
  {
    inputs: [{internalType: "address", name: "owner", type: "address"}],
    name: "balanceOf",
    outputs: [{internalType: "uint256", name: "", type: "uint256"}],
    stateMutability: "view",
    type: "function",
  },
];
export function isEthereumAddress(address) {
  return /^(0x)?[0-9a-fA-F]{40}$/.test(address);
}
export async function reverseResolveAddress(address) {
  if (isEthereumAddress(address)) {
    const url = `https://api.unstoppabledomains.com/resolve/reverse/${address}`;
    const headers = {
      Authorization: `Bearer 8cpvqmldkyhbbheoupgx6cgjjvnpvnoih9exsrrmqrlamtcw`,
    };

    try {
      const response = await axios.get(url, {headers});
      if (
        response.data.meta.domain === "" ||
        response.data.meta.domain === null
      ) {
        return undefined;
      } else {
        return response.data.meta.domain;
      }
    } catch (error) {
      throw error;
    }
  } else {
    return undefined;
  }
}
