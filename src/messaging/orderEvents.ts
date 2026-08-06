export type OrderCreatedEvent = {
    type: "OrderCreated"
    eventId: string
    orderId: string
    orderNumber: string
    userId: string
    totalAmount: number
    itemCount: number
    occurredAt: string
}

export type OrderEvent = OrderCreatedEvent
