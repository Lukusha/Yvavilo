export type FlowerType = 'rose' | 'tulip' | 'peony' | 'lily' | 'orchid' | 'sunflower' | 'carnation';
export interface User { id: string; name: string; email: string; avatar?: string }
export interface AuthUser extends User { staffRole?: 'admin' | 'operator' }
export interface Occasion { id: string; recipientId: string; name: string; date: string; type: string }
export interface Recipient { id: string; name: string; relationship: string; initials: string; color: string; photo?: string; phone?: string; birthday?: string; anniversary?: string; since?: string; address: string; notes: string; preferredFlowers: FlowerType[]; preferredColors: string[] }
export interface Flower { type: FlowerType; lifespanDays: number }
export interface Bouquet { available?: boolean; lifespanDays?: number; id: string; name: string; image: string; price: number; stems: { type: FlowerType; weight: number }[]; bestFor: string; category: string[]; description: string }
export type BouquetSize = 'standard' | 'grand' | 'signature';
export interface BouquetCustom { accent: 'none' | 'rose' | 'lily' | 'peony'; wrapping: 'ivory' | 'sage' | 'rose'; ribbon: 'linen' | 'terracotta' | 'brown'; note?: string }
export interface BagItem { key: string; bouquetId: string; size: BouquetSize; custom?: BouquetCustom }
export interface OrderItem { bouquetId: string; bouquetName: string; bouquetImage: string; size: BouquetSize; custom?: BouquetCustom; price: number }
export interface FlowerDelivery { id: string; recipientId: string; bouquetId: string; deliveredAt: string; estimatedLifespanDays?: number; message?: string }
export interface Order { id: string; recipientId: string; bouquetId: string; occasion: string; message: string; deliveryDate: string; deliveryTime: string; address: string; zone?: string; productPrice?: number; deliveryFee?: number; price: number; items?: OrderItem[]; status: 'Pending' | 'Confirmed' | 'Cancelled' | 'Delivered' | 'Scheduled'; recipientName?: string; recipientPhone?: string; bouquetName?: string; bouquetImage?: string; customerName?: string; customerEmail?: string; customerPhone?: string; proofImage?: string; deliveredAt?: string; createdAt: string }
export interface Notification { id: string; kind: 'freshness' | 'occasion' | 'delivery'; title: string; detail: string; recipientId?: string; read: boolean }
