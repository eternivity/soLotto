export const IDL = {
  "version": "0.1.0",
  "name": "solotto_program",
  "instructions": [
    {
      "name": "buyTicket",
      "accounts": [
        {
          "name": "buyer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "quantity",
          "type": "u32"
        }
      ]
    },
    {
      "name": "claimCommission",
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "startSeason",
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "season",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "seasonId",
          "type": "u32"
        }
      ]
    },
    {
      "name": "endSeason",
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "season",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "Season",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "seasonId",
            "type": "u32"
          },
          {
            "name": "totalTicketsSold",
            "type": "u32"
          },
          {
            "name": "totalPrizePool",
            "type": "u64"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "endTime",
            "type": "i64"
          },
          {
            "name": "winner",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "winnerTicketId",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "admin",
            "type": "publicKey"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "NotAdmin",
      "msg": "Only admin can perform this action"
    },
    {
      "code": 6001,
      "name": "SeasonNotActive",
      "msg": "Season is not active"
    },
    {
      "code": 6002,
      "name": "SeasonAlreadyEnded",
      "msg": "Season already ended"
    },
    {
      "code": 6003,
      "name": "InvalidTicketPrice",
      "msg": "Invalid ticket price"
    },
    {
      "code": 6004,
      "name": "NoTicketsSold",
      "msg": "No tickets sold"
    },
    {
      "code": 6005,
      "name": "WinnerAlreadySelected",
      "msg": "Winner already selected"
    },
    {
      "code": 6006,
      "name": "CommissionAlreadyClaimed",
      "msg": "Commission already claimed"
    }
  ]
};







