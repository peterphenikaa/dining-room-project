export type OrderCreatedEvent = {
    type: "OrderCreated"
    orderId: string
    orderNumber: string
    userId: string
    totalAmount: number
    itemCount: number
    occurredAt: string
}

export type OrderEvent = OrderCreatedEvent
