import React from 'react';
import { useAccount, useReadContract } from 'wagmi'
import { createWalletClient, custom, publicActions } from 'viem'
import { fiscobcos } from '../Web3Provider'
import { useQueryClient } from '@tanstack/react-query'

const wagmiContractConfig = {
    address: '0x2b5dcbae97f9d9178e8b051b08c9fb4089bae71b' as const,
    abi: [{"constant":true,"inputs":[],"name":"issuer","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"balances","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"receiver","type":"address"},{"name":"amount","type":"uint256"}],"name":"issue","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"receiver","type":"address"},{"name":"amount","type":"uint256"}],"name":"send","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"from","type":"address"},{"indexed":false,"name":"to","type":"address"},{"indexed":false,"name":"amount","type":"uint256"}],"name":"Sent","type":"event"}],
}

export function Test() {
    const { address } = useAccount()
    const [isPending, setIsPending] = React.useState(false)
    const [error, setError] = React.useState<Error | null>(null)
    const queryClient = useQueryClient()
    
    // 读取合约数据
    const { data: balance, isLoading: isLoadingBalance, refetch: refetchBalance } = useReadContract({
        ...wagmiContractConfig,
        functionName: 'balances',
        args: address ? [address] : undefined,
    })

    const { data: issuerAddress, isLoading: isLoadingIssuer, refetch: refetchIssuer } = useReadContract({
        ...wagmiContractConfig,
        functionName: 'issuer',
    })

    async function submit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setError(null)
        setIsPending(true)
        
        try {
            const formData = new FormData(e.target as HTMLFormElement)
            const amount = formData.get('amount') as string
            const toAddress = formData.get('address') as string

            const walletClient = createWalletClient({
                chain: fiscobcos,
                transport: custom(window.ethereum)
            }).extend(publicActions)

            const [account] = await walletClient.getAddresses()

            console.log('Sending transaction...')
            
            const hash = await walletClient.writeContract({
                address: wagmiContractConfig.address,
                abi: wagmiContractConfig.abi,
                functionName: 'issue',
                args: [toAddress, BigInt(amount)],
                account,
                gas: BigInt(3000000)
            })

            console.log('Transaction hash:', hash)
            
            const receipt = await walletClient.getTransactionReceipt({
                hash,
            })
            console.log('Transaction confirmed:', receipt)

            // 等待一小段时间确保区块链状态已更新
            await new Promise(resolve => setTimeout(resolve, 1000))

            // 使用 refetch 函数刷新数据
            await Promise.all([
                refetchBalance(),
                refetchIssuer()
            ])

        } catch (err) {
            console.error('Transaction error:', err)
            setError(err instanceof Error ? err : new Error('Transaction failed'))
        } finally {
            setIsPending(false)
        }
    }

    const isLoading = isLoadingBalance || isLoadingIssuer

    return (
        <>
            {isLoading ? <div>Loading...</div> : (
                <>
                    <div>address: {address}</div>
                    <div>balance: {balance?.toString()}</div>
                    <div>issuer: {issuerAddress?.toString()}</div>
                </>
            )}
            <form onSubmit={submit}>
                <input 
                    name="amount" 
                    placeholder="100" 
                    required 
                    disabled={isPending}
                />
                <input 
                    name="address" 
                    placeholder="0x6E860137C4788A54072BF819fB161606359c42FC" 
                    required 
                    disabled={isPending}
                />
                <button 
                    type="submit"
                    disabled={isPending}
                >
                    {isPending ? 'Confirming...' : 'Issue'}
                </button>
            </form>
            {error && (
                <div style={{ color: 'red' }}>
                    Error: {error.message}
                </div>
            )}
        </>
    )
}