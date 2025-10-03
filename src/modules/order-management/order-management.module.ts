import { Module } from "@nestjs/common";
import { PaymentGatewayModule } from "./payment-gateway/payment-gateway.module";
import { PaymentModule } from "./payment/module/payment.module";
import { InventoryModule } from "./inventory/module/inventory.module";
import { OrderModule } from "./order/module/order.module";

Module({
    imports: [OrderModule, InventoryModule, PaymentModule, PaymentGatewayModule],
    controllers: [],
    providers: [],
})

export class OrderManagementModule {}