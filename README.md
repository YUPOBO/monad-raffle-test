This is the front-end code of Monad Raffle (Testnet) implemented using NEXT.js and ethers.

project page: [monad-raffle-test.vercel.app](https://monad-raffle-test.vercel.app)

Monad Raffle (Testnet) is a web3 lottery automatically executed periodically on monad testnet.

The probability of winning is proportional to the player's invested amount.

In monad testnet, Chainlink has not yet implemented VRF and Keepers, 

but Chainlink's CCIP can be used in monad. Therefore:

- Using VRF on Avalanche's fuji net to generate random numbers. 

- Using CCIP to send random numbers to Monad testnet (The function of selecting winner is implemented in _ccipReceive).

- Using Keepers on Avalanche's fuji net to periodically call the send function. 

visit [contracts github pages](https://github.com/YUPOBO/lottery-monad-testnet-contracts)

MonadRaffleReceiver contract on [explorer](https://testnet.monadexplorer.com/address/0x472ed72434B35Bd562886256B5De87E887340D25?tab=Contract).

AvalancheRaffleSender contract on [explorer](https://subnets-test.avax.network/c-chain/address/0x528508327b2fa3b5d622b7c83152f8fe5d6fa3f7).

## Dependency

node.js and ethers are needed.

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.js`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.js`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) instead of React pages.

This project uses [`next/font`](https://nextjs.org/docs/pages/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn-pages-router) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/pages/building-your-application/deploying) for more details.
