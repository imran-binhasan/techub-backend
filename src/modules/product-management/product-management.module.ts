import { Module } from "@nestjs/common";
import { Product } from "./product/entity/product.entity";
import { ProductImage } from "./product_image/entity/product_image.entity";
import { Category } from "./category/entity/category.entity";
import { Brand } from "./brand/entity/brand.entity";
import { Cart } from "./cart/entity/cart.entity";
import { Wishlist } from "./wishlist/entity/wishlist.entity";
import { Attribute } from "./attribute/entity/attribute.entity";
import { AttributeValue } from "./attribute_value/entity/attribute_value.entity";
import { Coupon } from "./coupon/entity/coupon.entity";
import { ProductReview } from "./product_review/entity/product_review.entity";

@Module({
    imports: [Product, ProductImage, Category, Brand, Attribute, AttributeValue, Coupon, Cart, Wishlist, ProductReview],
    controllers: [],
    providers: [],
})

export class ProductManagementModule {}