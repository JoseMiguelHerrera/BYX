export const erc20ABI = [
  // Read-only functions
  {
    inputs: [],
    name: "name",
    outputs: [{ type: "string", name: "" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ type: "string", name: "" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ type: "uint8", name: "" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view",
    type: "function",
  },
  // Write functions
  {
    inputs: [
      { name: "recipient", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ type: "bool", name: "" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ type: "bool", name: "" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "sender", type: "address" },
      { name: "recipient", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "transferFrom",
    outputs: [{ type: "bool", name: "" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  // Events
  {
    type: "event",
    name: "Transfer",
    inputs: [
      { indexed: true, name: "from", type: "address" },
      { indexed: true, name: "to", type: "address" },
      { indexed: false, name: "value", type: "uint256" },
    ],
  },
  {
    type: "event",
    name: "Approval",
    inputs: [
      { indexed: true, name: "owner", type: "address" },
      { indexed: true, name: "spender", type: "address" },
      { indexed: false, name: "value", type: "uint256" },
    ],
  },
] as const;


export const lidoSubmitABI = [
  {
    type: 'function',
    name: 'submit',
    stateMutability: 'payable',
    inputs: [{ name: '_referral', type: 'address' }],
    outputs: [{ name: 'shares', type: 'uint256' }],
  },
];

export const lidoRequestWithdrawalABI = [
  {
    type: "function",
    name: "requestWithdrawals",
    stateMutability: "nonpayable",
    inputs: [
      {
        internalType: "uint256[]",
        name: "_amounts",
        type: "uint256[]"
      },
      {
        internalType: "address",
        name: "_owner",
        type: "address"
      }
    ],
    outputs: [
      {
        internalType: "uint256[]",
        name: "requestIds",
        type: "uint256[]"
      }
    ],
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_owner",
        "type": "address"
      }
    ],
    "name": "getWithdrawalRequests",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "requestsIds",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256[]",
        "name": "_requestIds",
        "type": "uint256[]"
      }
    ],
    "name": "getWithdrawalStatus",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "amountOfStETH",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "amountOfShares",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "owner",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "isFinalized",
            "type": "bool"
          },
          {
            "internalType": "bool",
            "name": "isClaimed",
            "type": "bool"
          }
        ],
        "internalType": "struct WithdrawalQueueBase.WithdrawalRequestStatus[]",
        "name": "statuses",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_requestId",
        "type": "uint256"
      }
    ],
    "name": "claimWithdrawal",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
];

