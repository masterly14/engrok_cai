import { useCallback, useEffect, useState } from 'react'
import { getAgentOrders, updateOrderStatus } from '@/actions/orders'
import { Order, OrderStatus } from '@prisma/client'

export function useAllOrders(agentId: string) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      const { orders, error } = await getAgentOrders(agentId)
      if (error) {
        setError(error)
        return
      }
      setOrders(orders as Order[])
    } catch (err) {
      setError('Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }, [agentId])

  const updateStatus = useCallback(async (orderId: string, status: OrderStatus) => {
    try {
      const { order, error } = await updateOrderStatus(orderId, status)
      if (error) {
        setError(error)
        return
      }
      setOrders(prev => prev.map(o => o.id === orderId ? order as Order : o))
    } catch (err) {
      setError('Failed to update order status')
    }
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  return {
    orders,
    loading,
    error,
    refetch: fetchOrders,
    updateStatus
  }
}
