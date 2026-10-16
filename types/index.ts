export type FlowerType = 'rose' | 'tulip' | 'peony' | 'lily' | 'orchid' | 'sunflower' | 'carnation';
export interface User { id: string; name: string; email: string; avatar?: string }
export interface Occasion { id: string; recipientId: string; name: string; date: string; type: string }
export interface Recipient { id: string; name: string; relationship: string; initials: string; color: string; photo?: string; birthday?: string; anniversary?: string; since?: string; address: string; notes: string; preferredFlowers: FlowerType[]; preferredColors: string[] }
export interface Flower { type: FlowerType; lifespanDays: number }
export interface Bouquet { id: string; name: string; image: string; price: number; stems: { type: FlowerType; weight: number }[]; bestFor: string; category: string[]; description: string }
export interface FlowerDelivery { id: string; recipientId: string; bouquetId: string; deliveredAt: string; estimatedLifespanDays?: number; message?: string }
export interface Order { id: string; recipientId: string; bouquetId: string; occasion: string; message: string; deliveryDate: string; deliveryTime: string; address: string; price: number; status: 'Delivered' | 'Scheduled'; createdAt: string }
export interface Notification { id: string; kind: 'freshness' | 'occasion' | 'delivery'; title: string; detail: string; recipientId?: string; read: boolean }
