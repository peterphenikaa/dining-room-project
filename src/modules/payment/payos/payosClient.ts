import { PayOS } from "@payos/node"
import { assertPayosConfigured, payosConfig } from "../../../config/env"

let client: PayOS | null = null

export function getPayOS(): PayOS {
    assertPayosConfigured()
    if (!client) {
        client = new PayOS({
            clientId: payosConfig.clientId,
            apiKey: payosConfig.apiKey,
            checksumKey: payosConfig.checksumKey,
        })
    }
    return client
}

export function generatePayosOrderCode(): number {
    const head = String(Date.now()).slice(-9)
    const tail = String(Math.floor(Math.random() * 1000)).padStart(3, "0")
    return Number(`${head}${tail}`)
}
