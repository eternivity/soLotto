import React, { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

export const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqData: FAQItem[] = [
    {
      question: "What is soLotto?",
      answer: "soLotto is a decentralized lottery application built on the Solana blockchain. Users can purchase tickets using SOL and participate in weekly draws with transparent, on-chain results."
    },
    {
      question: "How do I participate?",
      answer: "Connect your Solana wallet (Phantom, Solflare, etc.), purchase tickets for 0.1 SOL each, and wait for the season to end. Winners are automatically selected and prizes are distributed."
    },
    {
      question: "How are winners selected?",
      answer: "Winners are selected using a verifiable random function (VRF) on the Solana blockchain, ensuring fair and transparent results that cannot be manipulated."
    },
    {
      question: "What happens if I win?",
      answer: "If you win, the prize amount will be automatically transferred to your connected wallet address. You can check your transaction history on Solana Explorer."
    },
    {
      question: "How long does each season last?",
      answer: "Each season lasts 7 days and allows up to 100 tickets to be sold. The season automatically ends when either the time limit is reached or all tickets are sold."
    },
    {
      question: "Is this safe to use?",
      answer: "Yes! The smart contract is deployed on Solana Devnet and all transactions are transparent and verifiable on the blockchain. However, this is currently a test application."
    },
    {
      question: "What wallets are supported?",
      answer: "We support all major Solana wallets including Phantom, Solflare, Sollet, and others that are compatible with the Solana Wallet Adapter."
    },
    {
      question: "Can I buy multiple tickets?",
      answer: "Yes, you can purchase unlimited tickets in the same season. Each ticket costs $1 (≈ 0.1 SOL) and increases your chances of winning. Tickets are numbered sequentially from TKT-000001."
    },
    {
      question: "How are prizes paid out?",
      answer: "All prizes are paid out in SOL (Solana) cryptocurrency. The prize pool is calculated in USD but distributed as SOL equivalent. Winners receive their prizes automatically in their connected wallet."
    },
    {
      question: "What is the commission structure?",
      answer: "A 10% platform fee is deducted from each ticket sale. This commission goes to the platform administrators and can be claimed separately. The remaining 90% goes to the prize pool."
    },
    {
      question: "How do I know if I won?",
      answer: "Winners are automatically selected when the season ends. You can check the 'Winner Prize Status' section to see if your wallet address matches the winning address. Prizes are automatically transferred - no manual claim needed."
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-solana-purple to-solana-green bg-clip-text text-transparent mb-4">
          Frequently Asked Questions
        </h2>
        <p className="text-gray-400">
          Everything you need to know about soLotto
        </p>
      </div>

      <div className="space-y-4">
        {faqData.map((item, index) => (
          <div
            key={index}
            className="border border-gray-800 rounded-lg overflow-hidden"
          >
            <button
              onClick={() => toggleFAQ(index)}
              className="w-full px-6 py-4 text-left bg-gray-800 hover:bg-gray-700 transition-colors duration-200 flex justify-between items-center"
            >
              <span className="font-medium text-white">{item.question}</span>
              <span className={`text-solana-purple transition-transform duration-200 ${
                openIndex === index ? 'rotate-180' : ''
              }`}>
                ▼
              </span>
            </button>
            {openIndex === index && (
              <div className="px-6 py-4 bg-gray-900 border-t border-gray-800">
                <p className="text-gray-300 leading-relaxed">
                  {item.answer}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
