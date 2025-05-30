'use server'

import { db } from "@/utils"
import { OrderStatus } from "@prisma/client"

export async function getAgentOrders(agentId: string) {
  try {
    const orders = await db.order.findMany({
      where: {
        chatAgentId: agentId
      },
      include: {
        user: true,
        chatAgent: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    return { orders }
  } catch (error) {
    console.error('Error fetching orders:', error)
    return { error: 'Failed to fetch orders' }
  }
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  try {
    const order = await db.order.update({
      where: {
        id: orderId
      },
      data: {
        status
      }
    })
    return { order }
  } catch (error) {
    console.error('Error updating order:', error)
    return { error: 'Failed to update order' }
  }
}
