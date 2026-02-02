// ==================== REWARD PAGE FUNCTIONS ====================

// Complete reward data from Fnl-Reward.csv
const rewardsData = [
    { id: 'R-001', name: 'Halla Holla RM5 Croissant Voucher', category: 'Food & Beverages', merchant: 'Halla Holla', value: 5.00, pointsRequired: 125, expiryDate: '2026-06-30', adminId: 'D-001' },
    { id: 'R-002', name: 'Halla Holla RM8 Coffee Set', category: 'Food & Beverages', merchant: 'Halla Holla', value: 8.00, pointsRequired: 200, expiryDate: '2026-06-30', adminId: 'D-002' },
    { id: 'R-003', name: 'Halla Holla RM12 Breakfast Combo', category: 'Food & Beverages', merchant: 'Halla Holla', value: 12.00, pointsRequired: 300, expiryDate: '2026-06-30', adminId: 'D-003' },
    { id: 'R-004', name: 'Halla Holla RM20 Family Dessert Box', category: 'Food & Beverages', merchant: 'Halla Holla', value: 20.00, pointsRequired: 500, expiryDate: '2026-06-30', adminId: 'D-004' },
    { id: 'R-005', name: 'Tealive RM5 Milk Tea Voucher', category: 'Food & Beverages', merchant: 'Tealive', value: 5.00, pointsRequired: 125, expiryDate: '2026-07-31', adminId: 'D-005' },
    { id: 'R-006', name: 'Tealive RM10 Signature Drink', category: 'Food & Beverages', merchant: 'Tealive', value: 10.00, pointsRequired: 250, expiryDate: '2026-07-31', adminId: 'D-006' },
    { id: 'R-007', name: 'Tealive RM15 Fruit Tea Combo', category: 'Food & Beverages', merchant: 'Tealive', value: 15.00, pointsRequired: 375, expiryDate: '2026-07-31', adminId: 'D-007' },
    { id: 'R-008', name: 'Tealive RM25 Party Drink Pack', category: 'Food & Beverages', merchant: 'Tealive', value: 25.00, pointsRequired: 625, expiryDate: '2026-07-31', adminId: 'D-008' },
    { id: 'R-009', name: 'Domino\'s RM10 Personal Pizza', category: 'Food & Beverages', merchant: 'Domino\'s', value: 10.00, pointsRequired: 250, expiryDate: '2026-08-31', adminId: 'D-009' },
    { id: 'R-010', name: 'Domino\'s RM18 Lunch Deal', category: 'Food & Beverages', merchant: 'Domino\'s', value: 18.00, pointsRequired: 450, expiryDate: '2026-08-31', adminId: 'D-010' },
    { id: 'R-011', name: 'Domino\'s RM25 Medium Pizza Set', category: 'Food & Beverages', merchant: 'Domino\'s', value: 25.00, pointsRequired: 625, expiryDate: '2026-08-31', adminId: 'D-001' },
    { id: 'R-012', name: 'Domino\'s RM35 Family Combo', category: 'Food & Beverages', merchant: 'Domino\'s', value: 35.00, pointsRequired: 875, expiryDate: '2026-08-31', adminId: 'D-002' },
    { id: 'R-013', name: 'Mesra RM10 Convenience Voucher', category: 'Shopping & eCommerce', merchant: 'Mesra', value: 10.00, pointsRequired: 250, expiryDate: '2026-09-30', adminId: 'D-003' },
    { id: 'R-014', name: 'Mesra RM15 Snack Combo', category: 'Shopping & eCommerce', merchant: 'Mesra', value: 15.00, pointsRequired: 375, expiryDate: '2026-09-30', adminId: 'D-004' },
    { id: 'R-015', name: 'Mesra RM25 Fuel Credit', category: 'Shopping & eCommerce', merchant: 'Mesra', value: 25.00, pointsRequired: 625, expiryDate: '2026-09-30', adminId: 'D-005' },
    { id: 'R-016', name: 'Mesra RM40 Petrol Voucher', category: 'Shopping & eCommerce', merchant: 'Mesra', value: 40.00, pointsRequired: 1000, expiryDate: '2026-09-30', adminId: 'D-006' },
    { id: 'R-017', name: 'Lotus\'s RM10 Mini Grocery', category: 'Shopping & eCommerce', merchant: 'Lotus\'s Malaysia', value: 10.00, pointsRequired: 250, expiryDate: '2026-10-31', adminId: 'D-007' },
    { id: 'R-018', name: 'Lotus\'s RM20 Weekly Grocery', category: 'Shopping & eCommerce', merchant: 'Lotus\'s Malaysia', value: 20.00, pointsRequired: 500, expiryDate: '2026-10-31', adminId: 'D-008' },
    { id: 'R-019', name: 'Lotus\'s RM30 Family Basket', category: 'Shopping & eCommerce', merchant: 'Lotus\'s Malaysia', value: 30.00, pointsRequired: 750, expiryDate: '2026-10-31', adminId: 'D-009' },
    { id: 'R-020', name: 'Lotus\'s RM50 Bulk Shopping', category: 'Shopping & eCommerce', merchant: 'Lotus\'s Malaysia', value: 50.00, pointsRequired: 1250, expiryDate: '2026-10-31', adminId: 'D-010' },
    { id: 'R-021', name: 'Petronas Shop RM10 Online Credit', category: 'Shopping & eCommerce', merchant: 'Petronas Shop Online', value: 10.00, pointsRequired: 250, expiryDate: '2026-11-30', adminId: 'D-001' },
    { id: 'R-022', name: 'Petronas Shop RM20 Gift Card', category: 'Shopping & eCommerce', merchant: 'Petronas Shop Online', value: 20.00, pointsRequired: 500, expiryDate: '2026-11-30', adminId: 'D-002' },
    { id: 'R-023', name: 'Petronas Shop RM35 Premium Voucher', category: 'Shopping & eCommerce', merchant: 'Petronas Shop Online', value: 35.00, pointsRequired: 875, expiryDate: '2026-11-30', adminId: 'D-003' },
    { id: 'R-024', name: 'Petronas Shop RM60 Ultimate Pack', category: 'Shopping & eCommerce', merchant: 'Petronas Shop Online', value: 60.00, pointsRequired: 1500, expiryDate: '2026-11-30', adminId: 'D-004' },
    { id: 'R-025', name: 'Halla Holla RM15 Afternoon Tea Set', category: 'Food & Beverages', merchant: 'Halla Holla', value: 15.00, pointsRequired: 375, expiryDate: '2026-12-31', adminId: 'D-005' },
    { id: 'R-026', name: 'Tealive RM18 Brown Sugar Series', category: 'Food & Beverages', merchant: 'Tealive', value: 18.00, pointsRequired: 450, expiryDate: '2026-12-31', adminId: 'D-006' },
    { id: 'R-027', name: 'Domino\'s RM22 Dinner Special', category: 'Food & Beverages', merchant: 'Domino\'s', value: 22.00, pointsRequired: 550, expiryDate: '2026-12-31', adminId: 'D-007' },
    { id: 'R-028', name: 'Mesra RM12 Late Night Snack', category: 'Shopping & eCommerce', merchant: 'Mesra', value: 12.00, pointsRequired: 300, expiryDate: '2026-12-31', adminId: 'D-008' },
    { id: 'R-029', name: 'Lotus\'s RM25 Weekend Grocery', category: 'Shopping & eCommerce', merchant: 'Lotus\'s Malaysia', value: 25.00, pointsRequired: 625, expiryDate: '2026-12-31', adminId: 'D-009' },
    { id: 'R-030', name: 'Petronas Shop RM25 Online Gift', category: 'Shopping & eCommerce', merchant: 'Petronas Shop Online', value: 25.00, pointsRequired: 625, expiryDate: '2026-12-31', adminId: 'D-010' },
    { id: 'R-031', name: 'Halla Holla RM30 Celebration Box', category: 'Food & Beverages', merchant: 'Halla Holla', value: 30.00, pointsRequired: 750, expiryDate: '2027-01-31', adminId: 'D-001' },
    { id: 'R-032', name: 'Tealive RM30 Signature Bundle', category: 'Food & Beverages', merchant: 'Tealive', value: 30.00, pointsRequired: 750, expiryDate: '2027-01-31', adminId: 'D-002' },
    { id: 'R-033', name: 'Domino\'s RM40 Mega Feast', category: 'Food & Beverages', merchant: 'Domino\'s', value: 40.00, pointsRequired: 1000, expiryDate: '2027-01-31', adminId: 'D-003' },
    { id: 'R-034', name: 'Mesra RM30 Station Voucher', category: 'Shopping & eCommerce', merchant: 'Mesra', value: 30.00, pointsRequired: 750, expiryDate: '2027-01-31', adminId: 'D-004' },
    { id: 'R-035', name: 'Lotus\'s RM40 Grocery Saver', category: 'Shopping & eCommerce', merchant: 'Lotus\'s Malaysia', value: 40.00, pointsRequired: 1000, expiryDate: '2027-01-31', adminId: 'D-005' },
    { id: 'R-036', name: 'Petronas Shop RM40 Premium Online', category: 'Shopping & eCommerce', merchant: 'Petronas Shop Online', value: 40.00, pointsRequired: 1000, expiryDate: '2027-02-28', adminId: 'D-006' },
    { id: 'R-037', name: 'Halla Holla RM40 Premium Box', category: 'Food & Beverages', merchant: 'Halla Holla', value: 40.00, pointsRequired: 1000, expiryDate: '2027-02-28', adminId: 'D-007' },
    { id: 'R-038', name: 'Tealive RM40 Ultimate Drink Pack', category: 'Food & Beverages', merchant: 'Tealive', value: 40.00, pointsRequired: 1000, expiryDate: '2027-02-28', adminId: 'D-008' },
    { id: 'R-039', name: 'Domino\'s RM50 Celebration Combo', category: 'Food & Beverages', merchant: 'Domino\'s', value: 50.00, pointsRequired: 1250, expiryDate: '2027-02-28', adminId: 'D-009' },
    { id: 'R-040', name: 'Mesra RM50 Travel Fuel Credit', category: 'Shopping & eCommerce', merchant: 'Mesra', value: 50.00, pointsRequired: 1250, expiryDate: '2027-02-28', adminId: 'D-010' },
    { id: 'R-041', name: 'Lotus\'s RM60 Family Grocery Mega', category: 'Shopping & eCommerce', merchant: 'Lotus\'s Malaysia', value: 60.00, pointsRequired: 1500, expiryDate: '2027-03-31', adminId: 'D-001' },
    { id: 'R-042', name: 'Petronas Shop RM60 Exclusive Pack', category: 'Shopping & eCommerce', merchant: 'Petronas Shop Online', value: 60.00, pointsRequired: 1500, expiryDate: '2027-03-31', adminId: 'D-002' },
    { id: 'R-043', name: 'Halla Holla RM50 Party Dessert', category: 'Food & Beverages', merchant: 'Halla Holla', value: 50.00, pointsRequired: 1250, expiryDate: '2027-03-31', adminId: 'D-003' },
    { id: 'R-044', name: 'Tealive RM50 Celebration Drinks', category: 'Food & Beverages', merchant: 'Tealive', value: 50.00, pointsRequired: 1250, expiryDate: '2027-03-31', adminId: 'D-004' },
    { id: 'R-045', name: 'Domino\'s RM60 Weekend Feast', category: 'Food & Beverages', merchant: 'Domino\'s', value: 60.00, pointsRequired: 1500, expiryDate: '2027-03-31', adminId: 'D-005' },
    { id: 'R-046', name: 'Mesra RM60 Long Trip Fuel', category: 'Shopping & eCommerce', merchant: 'Mesra', value: 60.00, pointsRequired: 1500, expiryDate: '2027-04-30', adminId: 'D-006' },
    { id: 'R-047', name: 'Lotus\'s RM70 Monthly Grocery', category: 'Shopping & eCommerce', merchant: 'Lotus\'s Malaysia', value: 70.00, pointsRequired: 1750, expiryDate: '2027-04-30', adminId: 'D-007' },
    { id: 'R-048', name: 'Petronas Shop RM70 Premium Online', category: 'Shopping & eCommerce', merchant: 'Petronas Shop Online', value: 70.00, pointsRequired: 1750, expiryDate: '2027-04-30', adminId: 'D-008' },
    { id: 'R-049', name: 'Halla Holla RM60 Ultimate Dessert', category: 'Food & Beverages', merchant: 'Halla Holla', value: 60.00, pointsRequired: 1500, expiryDate: '2027-04-30', adminId: 'D-009' },
    { id: 'R-050', name: 'Tealive RM60 Gold Drink Package', category: 'Food & Beverages', merchant: 'Tealive', value: 60.00, pointsRequired: 1500, expiryDate: '2027-04-30', adminId: 'D-010' },
];

// Redemption history data from CSV
const redemptionsData = [
    { id: 'RR-001', dateTime: '2026-01-05 09:41:00', pointsDeducted: 600, promoCode: 'Group1-Kolek-9F2A', status: 'Redeemed', rewardId: 'R-004', householdId: 'H-0001' },
    { id: 'RR-002', dateTime: '2026-01-06 14:12:00', pointsDeducted: 125, promoCode: 'Group1-Kolek-1K8Q', status: 'Redeemed', rewardId: 'R-001', householdId: 'H-0001' },
    { id: 'RR-003', dateTime: '2026-01-06 18:30:00', pointsDeducted: 250, promoCode: 'Group1-Kolek-7M3D', status: 'Pending', rewardId: 'R-002', householdId: 'H-0002' },
    { id: 'RR-004', dateTime: '2026-01-07 10:05:00', pointsDeducted: 500, promoCode: 'Group1-Kolek-4V6P', status: 'Redeemed', rewardId: 'R-003', householdId: 'H-0003' },
    { id: 'RR-005', dateTime: '2026-01-07 12:44:00', pointsDeducted: 250, promoCode: 'Group1-Kolek-2J9S', status: 'Redeemed', rewardId: 'R-005', householdId: 'H-0004' },
    { id: 'RR-006', dateTime: '2026-01-08 08:10:00', pointsDeducted: 500, promoCode: 'Group1-Kolek-6C1H', status: 'Redeemed', rewardId: 'R-006', householdId: 'H-0002' },
    { id: 'RR-007', dateTime: '2026-01-08 09:55:00', pointsDeducted: 125, promoCode: 'Group1-Kolek-8R0N', status: 'Pending', rewardId: 'R-007', householdId: 'H-0005' },
    { id: 'RR-008', dateTime: '2026-01-08 16:20:00', pointsDeducted: 250, promoCode: 'Group1-Kolek-3T7B', status: 'Redeemed', rewardId: 'R-008', householdId: 'H-0006' },
    { id: 'RR-009', dateTime: '2026-01-09 11:33:00', pointsDeducted: 600, promoCode: 'Group1-Kolek-5W4L', status: 'Redeemed', rewardId: 'R-009', householdId: 'H-0007' },
    { id: 'RR-010', dateTime: '2026-01-09 19:05:00', pointsDeducted: 1200, promoCode: 'Group1-Kolek-0A9X', status: 'Pending', rewardId: 'R-010', householdId: 'H-0008' },
    { id: 'RR-011', dateTime: '2026-01-10 10:02:00', pointsDeducted: 125, promoCode: 'Group1-Kolek-9Q2F', status: 'Redeemed', rewardId: 'R-011', householdId: 'H-0009' },
    { id: 'RR-012', dateTime: '2026-01-10 13:18:00', pointsDeducted: 250, promoCode: 'Group1-Kolek-1Z7C', status: 'Redeemed', rewardId: 'R-012', householdId: 'H-0010' },
    { id: 'RR-013', dateTime: '2026-01-10 17:49:00', pointsDeducted: 500, promoCode: 'Group1-Kolek-4H6J', status: 'Cancelled', rewardId: 'R-013', householdId: 'H-0010' },
    { id: 'RR-014', dateTime: '2026-01-11 09:27:00', pointsDeducted: 600, promoCode: 'Group1-Kolek-7P3K', status: 'Redeemed', rewardId: 'R-014', householdId: 'H-0011' },
    { id: 'RR-015', dateTime: '2026-01-11 15:10:00', pointsDeducted: 250, promoCode: 'Group1-Kolek-2N8D', status: 'Pending', rewardId: 'R-015', householdId: 'H-0012' },
    { id: 'RR-016', dateTime: '2026-01-12 08:41:00', pointsDeducted: 500, promoCode: 'Group1-Kolek-6Y1M', status: 'Redeemed', rewardId: 'R-016', householdId: 'H-0013' },
    { id: 'RR-017', dateTime: '2026-01-12 12:22:00', pointsDeducted: 125, promoCode: 'Group1-Kolek-8E0R', status: 'Redeemed', rewardId: 'R-017', householdId: 'H-0014' },
    { id: 'RR-018', dateTime: '2026-01-12 20:03:00', pointsDeducted: 250, promoCode: 'Group1-Kolek-3U7S', status: 'Redeemed', rewardId: 'R-018', householdId: 'H-0003' },
    { id: 'RR-019', dateTime: '2026-01-13 10:15:00', pointsDeducted: 600, promoCode: 'Group1-Kolek-5B4T', status: 'Pending', rewardId: 'R-019', householdId: 'H-0015' },
    { id: 'RR-020', dateTime: '2026-01-13 18:40:00', pointsDeducted: 1200, promoCode: 'Group1-Kolek-0L9V', status: 'Redeemed', rewardId: 'R-020', householdId: 'H-0016' },
    { id: 'RR-021', dateTime: '2026-01-14 09:08:00', pointsDeducted: 125, promoCode: 'Group1-Kolek-9S2J', status: 'Redeemed', rewardId: 'R-021', householdId: 'H-0017' },
    { id: 'RR-022', dateTime: '2026-01-14 11:56:00', pointsDeducted: 250, promoCode: 'Group1-Kolek-1D7N', status: 'Redeemed', rewardId: 'R-022', householdId: 'H-0017' },
    { id: 'RR-023', dateTime: '2026-01-14 16:37:00', pointsDeducted: 500, promoCode: 'Group1-Kolek-4K6Q', status: 'Pending', rewardId: 'R-023', householdId: 'H-0018' },
    { id: 'RR-024', dateTime: '2026-01-15 10:24:00', pointsDeducted: 600, promoCode: 'Group1-Kolek-7F3A', status: 'Redeemed', rewardId: 'R-024', householdId: 'H-0019' },
    { id: 'RR-025', dateTime: '2026-01-15 14:59:00', pointsDeducted: 250, promoCode: 'Group1-Kolek-2R8H', status: 'Redeemed', rewardId: 'R-025', householdId: 'H-0020' },
    { id: 'RR-026', dateTime: '2026-01-16 08:05:00', pointsDeducted: 500, promoCode: 'Group1-Kolek-6N1P', status: 'Pending', rewardId: 'R-026', householdId: 'H-0021' },
    { id: 'RR-027', dateTime: '2026-01-16 12:33:00', pointsDeducted: 125, promoCode: 'Group1-Kolek-8C0Z', status: 'Redeemed', rewardId: 'R-027', householdId: 'H-0022' },
    { id: 'RR-028', dateTime: '2026-01-16 19:12:00', pointsDeducted: 250, promoCode: 'Group1-Kolek-3M7E', status: 'Redeemed', rewardId: 'R-028', householdId: 'H-0023' },
    { id: 'RR-029', dateTime: '2026-01-17 09:47:00', pointsDeducted: 600, promoCode: 'Group1-Kolek-5T4B', status: 'Cancelled', rewardId: 'R-029', householdId: 'H-0008' },
    { id: 'RR-030', dateTime: '2026-01-17 17:26:00', pointsDeducted: 1200, promoCode: 'Group1-Kolek-0V9C', status: 'Redeemed', rewardId: 'R-030', householdId: 'H-0024' },
    { id: 'RR-031', dateTime: '2026-01-18 10:11:00', pointsDeducted: 125, promoCode: 'Group1-Kolek-9H2M', status: 'Pending', rewardId: 'R-031', householdId: 'H-0025' },
    { id: 'RR-032', dateTime: '2026-01-18 13:40:00', pointsDeducted: 250, promoCode: 'Group1-Kolek-1Q7T', status: 'Redeemed', rewardId: 'R-032', householdId: 'H-0026' },
    { id: 'RR-033', dateTime: '2026-01-18 21:05:00', pointsDeducted: 500, promoCode: 'Group1-Kolek-4A6D', status: 'Redeemed', rewardId: 'R-033', householdId: 'H-0027' },
    { id: 'RR-034', dateTime: '2026-01-19 08:55:00', pointsDeducted: 600, promoCode: 'Group1-Kolek-7J3R', status: 'Redeemed', rewardId: 'R-034', householdId: 'H-0028' },
    { id: 'RR-035', dateTime: '2026-01-19 16:18:00', pointsDeducted: 250, promoCode: 'Group1-Kolek-2P8K', status: 'Pending', rewardId: 'R-035', householdId: 'H-0029' },
    { id: 'RR-036', dateTime: '2026-01-20 09:02:00', pointsDeducted: 500, promoCode: 'Group1-Kolek-6D1S', status: 'Redeemed', rewardId: 'R-036', householdId: 'H-0030' },
    { id: 'RR-037', dateTime: '2026-01-20 11:29:00', pointsDeducted: 125, promoCode: 'Group1-Kolek-8L0F', status: 'Redeemed', rewardId: 'R-037', householdId: 'H-0031' },
    { id: 'RR-038', dateTime: '2026-01-20 18:09:00', pointsDeducted: 250, promoCode: 'Group1-Kolek-3R7J', status: 'Pending', rewardId: 'R-038', householdId: 'H-0032' },
    { id: 'RR-039', dateTime: '2026-01-21 10:36:00', pointsDeducted: 600, promoCode: 'Group1-Kolek-5N4Q', status: 'Redeemed', rewardId: 'R-039', householdId: 'H-0033' },
    { id: 'RR-040', dateTime: '2026-01-21 19:58:00', pointsDeducted: 1200, promoCode: 'Group1-Kolek-0C9H', status: 'Redeemed', rewardId: 'R-040', householdId: 'H-0034' },
    { id: 'RR-041', dateTime: '2026-01-22 08:22:00', pointsDeducted: 125, promoCode: 'Group1-Kolek-9B2P', status: 'Redeemed', rewardId: 'R-041', householdId: 'H-0035' },
    { id: 'RR-042', dateTime: '2026-01-22 12:14:00', pointsDeducted: 250, promoCode: 'Group1-Kolek-1M7V', status: 'Cancelled', rewardId: 'R-042', householdId: 'H-0036' },
    { id: 'RR-043', dateTime: '2026-01-22 17:47:00', pointsDeducted: 500, promoCode: 'Group1-Kolek-4F6N', status: 'Redeemed', rewardId: 'R-043', householdId: 'H-0037' },
    { id: 'RR-044', dateTime: '2026-01-23 09:31:00', pointsDeducted: 600, promoCode: 'Group1-Kolek-7K3S', status: 'Pending', rewardId: 'R-044', householdId: 'H-0038' },
    { id: 'RR-045', dateTime: '2026-01-23 15:55:00', pointsDeducted: 250, promoCode: 'Group1-Kolek-2T8Z', status: 'Redeemed', rewardId: 'R-045', householdId: 'H-0039' },
    { id: 'RR-046', dateTime: '2026-01-24 08:18:00', pointsDeducted: 500, promoCode: 'Group1-Kolek-6Q1B', status: 'Redeemed', rewardId: 'R-046', householdId: 'H-0040' },
    { id: 'RR-047', dateTime: '2026-01-24 13:03:00', pointsDeducted: 125, promoCode: 'Group1-Kolek-8H0C', status: 'Pending', rewardId: 'R-047', householdId: 'H-0041' },
    { id: 'RR-048', dateTime: '2026-01-24 20:27:00', pointsDeducted: 250, promoCode: 'Group1-Kolek-3S7M', status: 'Redeemed', rewardId: 'R-048', householdId: 'H-0042' },
    { id: 'RR-049', dateTime: '2026-01-25 10:09:00', pointsDeducted: 600, promoCode: 'Group1-Kolek-5D4R', status: 'Redeemed', rewardId: 'R-049', householdId: 'H-0043' },
    { id: 'RR-050', dateTime: '2026-01-25 18:46:00', pointsDeducted: 1200, promoCode: 'Group1-Kolek-0P9N', status: 'Pending', rewardId: 'R-050', householdId: 'H-0044' },
    { id: 'RR-051', dateTime: '2026-02-05 20:00:00', pointsDeducted: 0, promoCode: 'Group1-Kolek-U2U7', status: 'Pending', rewardId: 'R-050', householdId: 'H-0003' },
    { id: 'RR-052', dateTime: '2026-02-06 01:00:00', pointsDeducted: 0, promoCode: 'Group1-Kolek-W5L6', status: 'Cancelled', rewardId: 'R-008', householdId: 'H-0017' },
    { id: 'RR-053', dateTime: '2026-02-06 06:00:00', pointsDeducted: 0, promoCode: 'Group1-Kolek-V8Y9', status: 'Cancelled', rewardId: 'R-034', householdId: 'H-0008' },
    { id: 'RR-054', dateTime: '2026-02-06 11:00:00', pointsDeducted: 0, promoCode: 'Group1-Kolek-Z3R1', status: 'Cancelled', rewardId: 'R-043', householdId: 'H-0015' },
    { id: 'RR-055', dateTime: '2026-02-06 16:00:00', pointsDeducted: 0, promoCode: 'Group1-Kolek-O5Z6', status: 'Cancelled', rewardId: 'R-049', householdId: 'H-0003' },
    { id: 'RR-056', dateTime: '2026-02-06 21:00:00', pointsDeducted: 0, promoCode: 'Group1-Kolek-E9P2', status: 'Pending', rewardId: 'R-047', householdId: 'H-0026' },
    { id: 'RR-057', dateTime: '2026-02-07 02:00:00', pointsDeducted: 750, promoCode: 'Group1-Kolek-A1Z7', status: 'Redeemed', rewardId: 'R-032', householdId: 'H-0011' },
    { id: 'RR-058', dateTime: '2026-02-07 07:00:00', pointsDeducted: 0, promoCode: 'Group1-Kolek-Q8F6', status: 'Cancelled', rewardId: 'R-033', householdId: 'H-0027' },
    { id: 'RR-059', dateTime: '2026-02-07 12:00:00', pointsDeducted: 0, promoCode: 'Group1-Kolek-K6Y1', status: 'Cancelled', rewardId: 'R-008', householdId: 'H-0010' },
    { id: 'RR-060', dateTime: '2026-02-07 17:00:00', pointsDeducted: 0, promoCode: 'Group1-Kolek-J2V3', status: 'Cancelled', rewardId: 'R-002', householdId: 'H-0004' },
    { id: 'RR-061', dateTime: '2026-02-07 22:00:00', pointsDeducted: 625, promoCode: 'Group1-Kolek-M6H9', status: 'Redeemed', rewardId: 'R-029', householdId: 'H-0024' },
    { id: 'RR-062', dateTime: '2026-02-08 03:00:00', pointsDeducted: 0, promoCode: 'Group1-Kolek-B1J3', status: 'Pending', rewardId: 'R-047', householdId: 'H-0027' },
    { id: 'RR-063', dateTime: '2026-02-08 08:00:00', pointsDeducted: 0, promoCode: 'Group1-Kolek-H3Y2', status: 'Cancelled', rewardId: 'R-005', householdId: 'H-0014' },
    { id: 'RR-064', dateTime: '2026-02-08 13:00:00', pointsDeducted: 200, promoCode: 'Group1-Kolek-T7N3', status: 'Redeemed', rewardId: 'R-002', householdId: 'H-0009' },
    { id: 'RR-065', dateTime: '2026-02-08 18:00:00', pointsDeducted: 125, promoCode: 'Group1-Kolek-L2E4', status: 'Redeemed', rewardId: 'R-001', householdId: 'H-0016' },
    { id: 'RR-066', dateTime: '2026-02-08 23:00:00', pointsDeducted: 0, promoCode: 'Group1-Kolek-Z6B9', status: 'Pending', rewardId: 'R-041', householdId: 'H-0020' },
    { id: 'RR-067', dateTime: '2026-02-09 04:00:00', pointsDeducted: 500, promoCode: 'Group1-Kolek-P3H7', status: 'Redeemed', rewardId: 'R-016', householdId: 'H-0013' },
    { id: 'RR-068', dateTime: '2026-02-09 09:00:00', pointsDeducted: 0, promoCode: 'Group1-Kolek-C5R8', status: 'Cancelled', rewardId: 'R-020', householdId: 'H-0028' },
    { id: 'RR-069', dateTime: '2026-02-09 14:00:00', pointsDeducted: 300, promoCode: 'Group1-Kolek-A9K4', status: 'Redeemed', rewardId: 'R-003', householdId: 'H-0005' },
    { id: 'RR-070', dateTime: '2026-02-09 19:00:00', pointsDeducted: 0, promoCode: 'Group1-Kolek-M7F2', status: 'Pending', rewardId: 'R-046', householdId: 'H-0018' },
    { id: 'RR-071', dateTime: '2026-02-10 00:00:00', pointsDeducted: 800, promoCode: 'Group1-Kolek-Q4Z6', status: 'Redeemed', rewardId: 'R-032', householdId: 'H-0022' },
    { id: 'RR-072', dateTime: '2026-02-10 05:00:00', pointsDeducted: 0, promoCode: 'Group1-Kolek-N8W3', status: 'Cancelled', rewardId: 'R-018', householdId: 'H-0011' },
    { id: 'RR-073', dateTime: '2026-02-10 10:00:00', pointsDeducted: 1250, promoCode: 'Group1-Kolek-Y6P4', status: 'Redeemed', rewardId: 'R-045', householdId: 'H-0026' },
    { id: 'RR-074', dateTime: '2026-02-10 15:00:00', pointsDeducted: 0, promoCode: 'Group1-Kolek-H9A2', status: 'Pending', rewardId: 'R-034', householdId: 'H-0019' },
    { id: 'RR-075', dateTime: '2026-02-10 20:00:00', pointsDeducted: 250, promoCode: 'Group1-Kolek-R3L7', status: 'Redeemed', rewardId: 'R-006', householdId: 'H-0007' },
    { id: 'RR-076', dateTime: '2026-02-11 01:00:00', pointsDeducted: 0, promoCode: 'Group1-Kolek-D5T9', status: 'Cancelled', rewardId: 'R-027', householdId: 'H-0024' },
    { id: 'RR-077', dateTime: '2026-02-11 06:00:00', pointsDeducted: 600, promoCode: 'Group1-Kolek-K8E1', status: 'Redeemed', rewardId: 'R-021', householdId: 'H-0021' },
    { id: 'RR-078', dateTime: '2026-02-11 11:00:00', pointsDeducted: 0, promoCode: 'Group1-Kolek-V2M6', status: 'Pending', rewardId: 'R-050', householdId: 'H-0006' },
    { id: 'RR-079', dateTime: '2026-02-11 16:00:00', pointsDeducted: 450, promoCode: 'Group1-Kolek-S7C5', status: 'Redeemed', rewardId: 'R-012', householdId: 'H-0010' },
    { id: 'RR-080', dateTime: '2026-02-11 21:00:00', pointsDeducted: 0, promoCode: 'Group1-Kolek-F4G8', status: 'Cancelled', rewardId: 'R-047', householdId: 'H-0015' },
    { id: 'RR-081', dateTime: '2026-02-12 02:00:00', pointsDeducted: 1000, promoCode: 'Group1-Kolek-B9Q2', status: 'Redeemed', rewardId: 'R-038', householdId: 'H-0023' },
    { id: 'RR-082', dateTime: '2026-02-12 07:00:00', pointsDeducted: 0, promoCode: 'Group1-Kolek-N5J7', status: 'Pending', rewardId: 'R-014', householdId: 'H-0017' },
    { id: 'RR-083', dateTime: '2026-02-12 12:00:00', pointsDeducted: 350, promoCode: 'Group1-Kolek-E1T4', status: 'Redeemed', rewardId: 'R-010', householdId: 'H-0028' },
    { id: 'RR-084', dateTime: '2026-02-12 17:00:00', pointsDeducted: 0, promoCode: 'Group1-Kolek-X6D9', status: 'Cancelled', rewardId: 'R-033', householdId: 'H-0002' },
    { id: 'RR-085', dateTime: '2026-02-12 22:00:00', pointsDeducted: 500, promoCode: 'Group1-Kolek-H4P8', status: 'Redeemed', rewardId: 'R-016', householdId: 'H-0020' },
    { id: 'RR-086', dateTime: '2026-02-13 03:00:00', pointsDeducted: 1000, promoCode: 'Group1-Kolek-Q3C1', status: 'Redeemed', rewardId: 'R-037', householdId: 'H-0012' },
    { id: 'RR-087', dateTime: '2026-02-13 08:00:00', pointsDeducted: 450, promoCode: 'Group1-Kolek-E2V3', status: 'Redeemed', rewardId: 'R-010', householdId: 'H-0012' },
    { id: 'RR-088', dateTime: '2026-02-13 13:00:00', pointsDeducted: 375, promoCode: 'Group1-Kolek-Q2C7', status: 'Redeemed', rewardId: 'R-007', householdId: 'H-0026' },
    { id: 'RR-089', dateTime: '2026-02-13 18:00:00', pointsDeducted: 750, promoCode: 'Group1-Kolek-Y2E5', status: 'Redeemed', rewardId: 'R-031', householdId: 'H-0023' },
    { id: 'RR-090', dateTime: '2026-02-13 23:00:00', pointsDeducted: 0, promoCode: 'Group1-Kolek-T5F4', status: 'Cancelled', rewardId: 'R-001', householdId: 'H-0012' },
    { id: 'RR-091', dateTime: '2026-02-14 04:00:00', pointsDeducted: 450, promoCode: 'Group1-Kolek-O7Y5', status: 'Redeemed', rewardId: 'R-026', householdId: 'H-0024' },
    { id: 'RR-092', dateTime: '2026-02-14 09:00:00', pointsDeducted: 0, promoCode: 'Group1-Kolek-L1P5', status: 'Cancelled', rewardId: 'R-007', householdId: 'H-0022' },
    { id: 'RR-093', dateTime: '2026-02-14 14:00:00', pointsDeducted: 200, promoCode: 'Group1-Kolek-Z7D8', status: 'Redeemed', rewardId: 'R-002', householdId: 'H-0003' },
    { id: 'RR-094', dateTime: '2026-02-14 19:00:00', pointsDeducted: 0, promoCode: 'Group1-Kolek-Q7H3', status: 'Pending', rewardId: 'R-047', householdId: 'H-0011' },
    { id: 'RR-095', dateTime: '2026-02-15 00:00:00', pointsDeducted: 750, promoCode: 'Group1-Kolek-V9R4', status: 'Redeemed', rewardId: 'R-031', householdId: 'H-0003' },
    { id: 'RR-096', dateTime: '2026-02-15 05:00:00', pointsDeducted: 0, promoCode: 'Group1-Kolek-J8G3', status: 'Pending', rewardId: 'R-050', householdId: 'H-0022' },
    { id: 'RR-097', dateTime: '2026-02-15 10:00:00', pointsDeducted: 250, promoCode: 'Group1-Kolek-X8E2', status: 'Redeemed', rewardId: 'R-009', householdId: 'H-0002' },
    { id: 'RR-098', dateTime: '2026-02-15 15:00:00', pointsDeducted: 0, promoCode: 'Group1-Kolek-G5N2', status: 'Cancelled', rewardId: 'R-014', householdId: 'H-0019' },
    { id: 'RR-099', dateTime: '2026-02-15 20:00:00', pointsDeducted: 450, promoCode: 'Group1-Kolek-X8Y7', status: 'Redeemed', rewardId: 'R-010', householdId: 'H-0026' },
    { id: 'RR-100', dateTime: '2026-02-16 01:00:00', pointsDeducted: 0, promoCode: 'Group1-Kolek-R8A3', status: 'Pending', rewardId: 'R-035', householdId: 'H-0015' },
    { id: 'RR-101', dateTime: '2026-02-16 06:00:00', pointsDeducted: 125, promoCode: 'Group1-Kolek-A1B3', status: 'Redeemed', rewardId: 'R-001', householdId: 'H-0014' },
    { id: 'RR-102', dateTime: '2026-02-16 11:00:00', pointsDeducted: 200, promoCode: 'Group1-Kolek-C4D6', status: 'Redeemed', rewardId: 'R-002', householdId: 'H-0009' },
    { id: 'RR-103', dateTime: '2026-02-16 16:00:00', pointsDeducted: 300, promoCode: 'Group1-Kolek-E7F2', status: 'Redeemed', rewardId: 'R-003', householdId: 'H-0021' },
    { id: 'RR-104', dateTime: '2026-02-16 21:00:00', pointsDeducted: 0, promoCode: 'Group1-Kolek-G9H1', status: 'Pending', rewardId: 'R-014', householdId: 'H-0012' },
    { id: 'RR-105', dateTime: '2026-02-17 02:00:00', pointsDeducted: 500, promoCode: 'Group1-Kolek-J3K8', status: 'Redeemed', rewardId: 'R-004', householdId: 'H-0003' },
    { id: 'RR-106', dateTime: '2026-02-17 07:00:00', pointsDeducted: 125, promoCode: 'Group1-Kolek-L2M7', status: 'Redeemed', rewardId: 'R-005', householdId: 'H-0017' },
    { id: 'RR-107', dateTime: '2026-02-17 12:00:00', pointsDeducted: 200, promoCode: 'Group1-Kolek-N4P6', status: 'Redeemed', rewardId: 'R-002', householdId: 'H-0008' },
    { id: 'RR-108', dateTime: '2026-02-17 17:00:00', pointsDeducted: 0, promoCode: 'Group1-Kolek-Q5R9', status: 'Cancelled', rewardId: 'R-019', householdId: 'H-0026' },
    { id: 'RR-109', dateTime: '2026-02-17 22:00:00', pointsDeducted: 300, promoCode: 'Group1-Kolek-S8T4', status: 'Redeemed', rewardId: 'R-003', householdId: 'H-0010' },
    { id: 'RR-110', dateTime: '2026-02-18 03:00:00', pointsDeducted: 1250, promoCode: 'Group1-Kolek-U7V5', status: 'Redeemed', rewardId: 'R-045', householdId: 'H-0023' },
    { id: 'RR-111', dateTime: '2026-02-18 08:00:00', pointsDeducted: 750, promoCode: 'Group1-Kolek-W3X6', status: 'Redeemed', rewardId: 'R-031', householdId: 'H-0019' },
    { id: 'RR-112', dateTime: '2026-02-18 13:00:00', pointsDeducted: 125, promoCode: 'Group1-Kolek-Y2Z4', status: 'Redeemed', rewardId: 'R-001', householdId: 'H-0005' },
    { id: 'RR-113', dateTime: '2026-02-18 18:00:00', pointsDeducted: 500, promoCode: 'Group1-Kolek-A6B8', status: 'Redeemed', rewardId: 'R-016', householdId: 'H-0027' },
    { id: 'RR-114', dateTime: '2026-02-18 23:00:00', pointsDeducted: 0, promoCode: 'Group1-Kolek-C1D9', status: 'Pending', rewardId: 'R-050', householdId: 'H-0016' },
    { id: 'RR-115', dateTime: '2026-02-19 04:00:00', pointsDeducted: 800, promoCode: 'Group1-Kolek-E4F7', status: 'Redeemed', rewardId: 'R-032', householdId: 'H-0002' },
    { id: 'RR-116', dateTime: '2026-02-19 09:00:00', pointsDeducted: 300, promoCode: 'Group1-Kolek-G8H3', status: 'Redeemed', rewardId: 'R-003', householdId: 'H-0025' },
    { id: 'RR-117', dateTime: '2026-02-19 14:00:00', pointsDeducted: 450, promoCode: 'Group1-Kolek-J5K1', status: 'Redeemed', rewardId: 'R-012', householdId: 'H-0011' },
    { id: 'RR-118', dateTime: '2026-02-19 19:00:00', pointsDeducted: 0, promoCode: 'Group1-Kolek-L9M2', status: 'Pending', rewardId: 'R-046', householdId: 'H-0028' },
    { id: 'RR-119', dateTime: '2026-02-20 00:00:00', pointsDeducted: 200, promoCode: 'Group1-Kolek-N7P3', status: 'Redeemed', rewardId: 'R-002', householdId: 'H-0013' },
    { id: 'RR-120', dateTime: '2026-02-20 05:00:00', pointsDeducted: 1000, promoCode: 'Group1-Kolek-Q6R4', status: 'Redeemed', rewardId: 'R-038', householdId: 'H-0020' },
    { id: 'RR-121', dateTime: '2026-02-20 10:00:00', pointsDeducted: 125, promoCode: 'Group1-Kolek-S5T9', status: 'Redeemed', rewardId: 'R-001', householdId: 'H-0007' },
    { id: 'RR-122', dateTime: '2026-02-20 15:00:00', pointsDeducted: 1500, promoCode: 'Group1-Kolek-U3V8', status: 'Redeemed', rewardId: 'R-039', householdId: 'H-0015' },
    { id: 'RR-123', dateTime: '2026-02-20 20:00:00', pointsDeducted: 350, promoCode: 'Group1-Kolek-W6X2', status: 'Redeemed', rewardId: 'R-010', householdId: 'H-0024' },
    { id: 'RR-124', dateTime: '2026-02-21 01:00:00', pointsDeducted: 0, promoCode: 'Group1-Kolek-Y8Z5', status: 'Cancelled', rewardId: 'R-027', householdId: 'H-0018' },
    { id: 'RR-125', dateTime: '2026-02-21 06:00:00', pointsDeducted: 600, promoCode: 'Group1-Kolek-A7B4', status: 'Redeemed', rewardId: 'R-021', householdId: 'H-0022' },
    { id: 'RR-126', dateTime: '2026-02-21 11:00:00', pointsDeducted: 1250, promoCode: 'Group1-Kolek-C3D5', status: 'Redeemed', rewardId: 'R-045', householdId: 'H-0001' },
    { id: 'RR-127', dateTime: '2026-02-21 16:00:00', pointsDeducted: 125, promoCode: 'Group1-Kolek-E2F9', status: 'Redeemed', rewardId: 'R-005', householdId: 'H-0014' },
    { id: 'RR-128', dateTime: '2026-02-21 21:00:00', pointsDeducted: 300, promoCode: 'Group1-Kolek-G6H1', status: 'Redeemed', rewardId: 'R-003', householdId: 'H-0026' },
    { id: 'RR-129', dateTime: '2026-02-22 02:00:00', pointsDeducted: 0, promoCode: 'Group1-Kolek-J4K7', status: 'Pending', rewardId: 'R-033', householdId: 'H-0010' },
    { id: 'RR-130', dateTime: '2026-02-22 07:00:00', pointsDeducted: 750, promoCode: 'Group1-Kolek-L8M3', status: 'Redeemed', rewardId: 'R-031', householdId: 'H-0006' },
    { id: 'RR-131', dateTime: '2026-02-22 12:00:00', pointsDeducted: 300, promoCode: 'Group1-Kolek-A2F9', status: 'Redeemed', rewardId: 'R-003', householdId: 'H-0015' },
    { id: 'RR-132', dateTime: '2026-02-22 17:00:00', pointsDeducted: 200, promoCode: 'Group1-Kolek-B7K3', status: 'Redeemed', rewardId: 'R-002', householdId: 'H-0004' },
    { id: 'RR-133', dateTime: '2026-02-22 22:00:00', pointsDeducted: 750, promoCode: 'Group1-Kolek-C8M2', status: 'Redeemed', rewardId: 'R-031', householdId: 'H-0021' },
    { id: 'RR-134', dateTime: '2026-02-23 03:00:00', pointsDeducted: 0, promoCode: 'Group1-Kolek-D4P7', status: 'Pending', rewardId: 'R-050', householdId: 'H-0019' },
    { id: 'RR-135', dateTime: '2026-02-23 08:00:00', pointsDeducted: 125, promoCode: 'Group1-Kolek-E6T1', status: 'Redeemed', rewardId: 'R-001', householdId: 'H-0008' },
    { id: 'RR-136', dateTime: '2026-02-23 13:00:00', pointsDeducted: 500, promoCode: 'Group1-Kolek-F9R4', status: 'Redeemed', rewardId: 'R-016', householdId: 'H-0026' },
    { id: 'RR-137', dateTime: '2026-02-23 18:00:00', pointsDeducted: 350, promoCode: 'Group1-Kolek-G2H5', status: 'Redeemed', rewardId: 'R-010', householdId: 'H-0012' },
    { id: 'RR-138', dateTime: '2026-02-23 23:00:00', pointsDeducted: 1250, promoCode: 'Group1-Kolek-H8A6', status: 'Redeemed', rewardId: 'R-045', householdId: 'H-0024' },
    { id: 'RR-139', dateTime: '2026-02-24 04:00:00', pointsDeducted: 600, promoCode: 'Group1-Kolek-J3N9', status: 'Redeemed', rewardId: 'R-021', householdId: 'H-0017' },
    { id: 'RR-140', dateTime: '2026-02-24 09:00:00', pointsDeducted: 0, promoCode: 'Group1-Kolek-K7B4', status: 'Cancelled', rewardId: 'R-027', householdId: 'H-0006' },
    { id: 'RR-141', dateTime: '2026-02-24 14:00:00', pointsDeducted: 1000, promoCode: 'Group1-Kolek-L5Q8', status: 'Redeemed', rewardId: 'R-038', householdId: 'H-0020' },
    { id: 'RR-142', dateTime: '2026-02-24 19:00:00', pointsDeducted: 125, promoCode: 'Group1-Kolek-M4Z2', status: 'Redeemed', rewardId: 'R-001', householdId: 'H-0011' },
    { id: 'RR-143', dateTime: '2026-02-25 00:00:00', pointsDeducted: 450, promoCode: 'Group1-Kolek-N6S3', status: 'Redeemed', rewardId: 'R-012', householdId: 'H-0003' },
    { id: 'RR-144', dateTime: '2026-02-25 05:00:00', pointsDeducted: 1500, promoCode: 'Group1-Kolek-P8C7', status: 'Redeemed', rewardId: 'R-039', householdId: 'H-0028' },
    { id: 'RR-145', dateTime: '2026-02-25 10:00:00', pointsDeducted: 250, promoCode: 'Group1-Kolek-Q1E5', status: 'Redeemed', rewardId: 'R-006', householdId: 'H-0018' },
    { id: 'RR-146', dateTime: '2026-02-25 15:00:00', pointsDeducted: 0, promoCode: 'Group1-Kolek-R4H9', status: 'Pending', rewardId: 'R-046', householdId: 'H-0013' },
    { id: 'RR-147', dateTime: '2026-02-25 20:00:00', pointsDeducted: 800, promoCode: 'Group1-Kolek-S7M6', status: 'Redeemed', rewardId: 'R-032', householdId: 'H-0009' },
    { id: 'RR-148', dateTime: '2026-02-26 01:00:00', pointsDeducted: 300, promoCode: 'Group1-Kolek-T2K8', status: 'Redeemed', rewardId: 'R-003', householdId: 'H-0025' },
    { id: 'RR-149', dateTime: '2026-02-26 06:00:00', pointsDeducted: 500, promoCode: 'Group1-Kolek-U9B4', status: 'Redeemed', rewardId: 'R-016', householdId: 'H-0010' },
    { id: 'RR-150', dateTime: '2026-02-26 11:00:00', pointsDeducted: 0, promoCode: 'Group1-Kolek-V6N7', status: 'Cancelled', rewardId: 'R-020', householdId: 'H-0022' },
    { id: 'RR-151', dateTime: '2026-02-26 16:00:00', pointsDeducted: 125, promoCode: 'Group1-Kolek-W5F3', status: 'Redeemed', rewardId: 'R-001', householdId: 'H-0001' },
    { id: 'RR-152', dateTime: '2026-02-26 21:00:00', pointsDeducted: 200, promoCode: 'Group1-Kolek-X8P6', status: 'Redeemed', rewardId: 'R-002', householdId: 'H-0027' },
    { id: 'RR-153', dateTime: '2026-02-27 02:00:00', pointsDeducted: 650, promoCode: 'Group1-Kolek-Y4T1', status: 'Redeemed', rewardId: 'R-022', householdId: 'H-0014' },
    { id: 'RR-154', dateTime: '2026-02-27 07:00:00', pointsDeducted: 1000, promoCode: 'Group1-Kolek-Z7Q5', status: 'Redeemed', rewardId: 'R-038', householdId: 'H-0023' },
    { id: 'RR-155', dateTime: '2026-02-27 12:00:00', pointsDeducted: 0, promoCode: 'Group1-Kolek-A9L2', status: 'Pending', rewardId: 'R-034', householdId: 'H-0016' },
    { id: 'RR-156', dateTime: '2026-02-27 17:00:00', pointsDeducted: 350, promoCode: 'Group1-Kolek-B6C8', status: 'Redeemed', rewardId: 'R-010', householdId: 'H-0005' },
    { id: 'RR-157', dateTime: '2026-02-27 22:00:00', pointsDeducted: 1250, promoCode: 'Group1-Kolek-C5M7', status: 'Redeemed', rewardId: 'R-045', householdId: 'H-0019' },
    { id: 'RR-158', dateTime: '2026-02-28 03:00:00', pointsDeducted: 600, promoCode: 'Group1-Kolek-D3E9', status: 'Redeemed', rewardId: 'R-021', householdId: 'H-0026' },
    { id: 'RR-159', dateTime: '2026-02-28 08:00:00', pointsDeducted: 300, promoCode: 'Group1-Kolek-E7H4', status: 'Redeemed', rewardId: 'R-003', householdId: 'H-0021' },
    { id: 'RR-160', dateTime: '2026-02-28 13:00:00', pointsDeducted: 0, promoCode: 'Group1-Kolek-F2N6', status: 'Cancelled', rewardId: 'R-027', householdId: 'H-0007' },
    { id: 'RR-161', dateTime: '2026-02-28 18:00:00', pointsDeducted: 1500, promoCode: 'Group1-Kolek-G9R1', status: 'Redeemed', rewardId: 'R-039', householdId: 'H-0012' },
    { id: 'RR-162', dateTime: '2026-02-28 23:00:00', pointsDeducted: 125, promoCode: 'Group1-Kolek-H6K3', status: 'Redeemed', rewardId: 'R-001', householdId: 'H-0024' },
    { id: 'RR-163', dateTime: '2026-03-01 04:00:00', pointsDeducted: 450, promoCode: 'Group1-Kolek-J5S8', status: 'Redeemed', rewardId: 'R-012', householdId: 'H-0015' },
    { id: 'RR-164', dateTime: '2026-03-01 09:00:00', pointsDeducted: 750, promoCode: 'Group1-Kolek-K8B4', status: 'Redeemed', rewardId: 'R-031', householdId: 'H-0028' },
    { id: 'RR-165', dateTime: '2026-03-01 14:00:00', pointsDeducted: 200, promoCode: 'Group1-Kolek-L4P9', status: 'Redeemed', rewardId: 'R-002', householdId: 'H-0010' },
    { id: 'RR-166', dateTime: '2026-03-01 19:00:00', pointsDeducted: 0, promoCode: 'Group1-Kolek-M7F2', status: 'Pending', rewardId: 'R-050', householdId: 'H-0006' },
    { id: 'RR-167', dateTime: '2026-03-02 00:00:00', pointsDeducted: 500, promoCode: 'Group1-Kolek-N3C5', status: 'Redeemed', rewardId: 'R-016', householdId: 'H-0020' },
    { id: 'RR-168', dateTime: '2026-03-02 05:00:00', pointsDeducted: 350, promoCode: 'Group1-Kolek-P8H1', status: 'Redeemed', rewardId: 'R-010', householdId: 'H-0013' },
    { id: 'RR-169', dateTime: '2026-03-02 10:00:00', pointsDeducted: 1000, promoCode: 'Group1-Kolek-Q6R7', status: 'Redeemed', rewardId: 'R-038', householdId: 'H-0022' },
    { id: 'RR-170', dateTime: '2026-03-02 15:00:00', pointsDeducted: 125, promoCode: 'Group1-Kolek-R9E4', status: 'Redeemed', rewardId: 'R-001', householdId: 'H-0002' },
    { id: 'RR-171', dateTime: '2026-03-02 20:00:00', pointsDeducted: 800, promoCode: 'Group1-Kolek-S5M6', status: 'Redeemed', rewardId: 'R-032', householdId: 'H-0018' },
    { id: 'RR-172', dateTime: '2026-03-03 01:00:00', pointsDeducted: 250, promoCode: 'Group1-Kolek-T7B9', status: 'Redeemed', rewardId: 'R-006', householdId: 'H-0027' },
    { id: 'RR-173', dateTime: '2026-03-03 06:00:00', pointsDeducted: 600, promoCode: 'Group1-Kolek-U4K2', status: 'Redeemed', rewardId: 'R-021', householdId: 'H-0011' },
    { id: 'RR-174', dateTime: '2026-03-03 11:00:00', pointsDeducted: 0, promoCode: 'Group1-Kolek-V1N8', status: 'Cancelled', rewardId: 'R-020', householdId: 'H-0025' },
    { id: 'RR-175', dateTime: '2026-03-03 16:00:00', pointsDeducted: 1500, promoCode: 'Group1-Kolek-W9C7', status: 'Redeemed', rewardId: 'R-039', householdId: 'H-0017' },
    { id: 'RR-176', dateTime: '2026-03-03 21:00:00', pointsDeducted: 450, promoCode: 'Group1-Kolek-X6H3', status: 'Redeemed', rewardId: 'R-012', householdId: 'H-0024' },
    { id: 'RR-177', dateTime: '2026-03-04 02:00:00', pointsDeducted: 1250, promoCode: 'Group1-Kolek-Y8R5', status: 'Redeemed', rewardId: 'R-045', householdId: 'H-0004' },
    { id: 'RR-178', dateTime: '2026-03-04 07:00:00', pointsDeducted: 300, promoCode: 'Group1-Kolek-Z2E6', status: 'Redeemed', rewardId: 'R-003', householdId: 'H-0021' },
    { id: 'RR-179', dateTime: '2026-03-04 12:00:00', pointsDeducted: 200, promoCode: 'Group1-Kolek-A7P9', status: 'Redeemed', rewardId: 'R-002', householdId: 'H-0016' },
    { id: 'RR-180', dateTime: '2026-03-04 17:00:00', pointsDeducted: 0, promoCode: 'Group1-Kolek-B3M1', status: 'Pending', rewardId: 'R-034', householdId: 'H-0028' },
    { id: 'RR-181', dateTime: '2026-03-04 22:00:00', pointsDeducted: 750, promoCode: 'Group1-Kolek-C9H4', status: 'Redeemed', rewardId: 'R-031', householdId: 'H-0008' },
    { id: 'RR-182', dateTime: '2026-03-05 03:00:00', pointsDeducted: 350, promoCode: 'Group1-Kolek-D6K7', status: 'Redeemed', rewardId: 'R-010', householdId: 'H-0019' },
    { id: 'RR-183', dateTime: '2026-03-05 08:00:00', pointsDeducted: 1000, promoCode: 'Group1-Kolek-E5R2', status: 'Redeemed', rewardId: 'R-038', householdId: 'H-0023' },
    { id: 'RR-184', dateTime: '2026-03-05 13:00:00', pointsDeducted: 125, promoCode: 'Group1-Kolek-F4B8', status: 'Redeemed', rewardId: 'R-001', householdId: 'H-0014' },
    { id: 'RR-185', dateTime: '2026-03-05 18:00:00', pointsDeducted: 600, promoCode: 'Group1-Kolek-G7N3', status: 'Redeemed', rewardId: 'R-021', householdId: 'H-0005' },
    { id: 'RR-186', dateTime: '2026-03-05 23:00:00', pointsDeducted: 1500, promoCode: 'Group1-Kolek-H8C9', status: 'Redeemed', rewardId: 'R-039', householdId: 'H-0020' },
    { id: 'RR-187', dateTime: '2026-03-06 04:00:00', pointsDeducted: 450, promoCode: 'Group1-Kolek-J1S6', status: 'Redeemed', rewardId: 'R-012', householdId: 'H-0012' },
    { id: 'RR-188', dateTime: '2026-03-06 09:00:00', pointsDeducted: 200, promoCode: 'Group1-Kolek-K9E5', status: 'Redeemed', rewardId: 'R-002', householdId: 'H-0026' },
    { id: 'RR-189', dateTime: '2026-03-06 14:00:00', pointsDeducted: 800, promoCode: 'Group1-Kolek-L3M7', status: 'Redeemed', rewardId: 'R-032', householdId: 'H-0018' },
    { id: 'RR-190', dateTime: '2026-03-06 19:00:00', pointsDeducted: 0, promoCode: 'Group1-Kolek-M2R4', status: 'Cancelled', rewardId: 'R-027', householdId: 'H-0003' },
    { id: 'RR-191', dateTime: '2026-03-07 00:00:00', pointsDeducted: 300, promoCode: 'Group1-Kolek-N8H1', status: 'Redeemed', rewardId: 'R-003', householdId: 'H-0022' },
    { id: 'RR-192', dateTime: '2026-03-07 05:00:00', pointsDeducted: 125, promoCode: 'Group1-Kolek-P4B6', status: 'Redeemed', rewardId: 'R-001', householdId: 'H-0010' },
    { id: 'RR-193', dateTime: '2026-03-07 10:00:00', pointsDeducted: 650, promoCode: 'Group1-Kolek-Q7K9', status: 'Redeemed', rewardId: 'R-022', householdId: 'H-0027' },
    { id: 'RR-194', dateTime: '2026-03-07 15:00:00', pointsDeducted: 1000, promoCode: 'Group1-Kolek-R6M3', status: 'Redeemed', rewardId: 'R-038', householdId: 'H-0017' },
    { id: 'RR-195', dateTime: '2026-03-07 20:00:00', pointsDeducted: 250, promoCode: 'Group1-Kolek-S5E8', status: 'Redeemed', rewardId: 'R-006', householdId: 'H-0025' },
    { id: 'RR-196', dateTime: '2026-03-08 01:00:00', pointsDeducted: 450, promoCode: 'Group1-Kolek-T3C4', status: 'Redeemed', rewardId: 'R-012', householdId: 'H-0009' },
    { id: 'RR-197', dateTime: '2026-03-08 06:00:00', pointsDeducted: 1500, promoCode: 'Group1-Kolek-U8R2', status: 'Redeemed', rewardId: 'R-039', householdId: 'H-0021' },
    { id: 'RR-198', dateTime: '2026-03-08 11:00:00', pointsDeducted: 200, promoCode: 'Group1-Kolek-V6H7', status: 'Redeemed', rewardId: 'R-002', householdId: 'H-0013' },
    { id: 'RR-199', dateTime: '2026-03-08 16:00:00', pointsDeducted: 300, promoCode: 'Group1-Kolek-W4K5', status: 'Redeemed', rewardId: 'R-003', householdId: 'H-0011' },
    { id: 'RR-200', dateTime: '2026-03-08 21:00:00', pointsDeducted: 125, promoCode: 'Group1-Kolek-X9B1', status: 'Redeemed', rewardId: 'R-001', householdId: 'H-0006' },
];

// Initialize reward page with page setup
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const auth = localStorage.getItem('kolek_auth');
    if (!auth) {
        window.location.href = 'index.html';
        return;
    }

    // Initialize reward functionality
    initializeRewardPage();
    initializeRedemptionPage();
    
    // Setup header controls
    setupHeaderControls();
    
    // Update date
    updateDate();
    setInterval(updateDate, 60000);
    
    // Setup logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('kolek_auth');
            localStorage.removeItem('kolek_admin');
            window.location.href = 'index.html';
        });
    }

    // Setup profile click
    const headerAvatar = document.getElementById('header-user-avatar');
    if (headerAvatar) {
        headerAvatar.addEventListener('click', function(e) {
            e.preventDefault();
            const hasProfile = document.getElementById('profile-content');
            if (hasProfile && typeof openProfilePage === 'function') {
                openProfilePage();
                return;
            }
            window.location.href = 'dashboard.html';
        });
    }
});

// Setup header controls
function setupHeaderControls() {
    // Refresh button
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            initializeRewardPage();
        });
    }

    // Export PDF button
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            alert('Export PDF functionality - coming soon');
        });
    }
}

// Update current date
function updateDate() {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    const today = new Date().toLocaleDateString('en-US', options);
    const dateDisplay = document.getElementById('current-date');
    if (dateDisplay) {
        dateDisplay.textContent = `Today, ${today}`;
    }
}

// Initialize reward page
function initializeRewardPage() {
    loadRewardsTable();
    setupRewardEventListeners();
}

// Load rewards table
function loadRewardsTable(page = 1, itemsPerPage = 10, filter = {}) {
    let filteredData = rewardsData;
    
    // Apply filters
    if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        filteredData = filteredData.filter(r => 
            r.name.toLowerCase().includes(searchLower) || 
            r.id.toLowerCase().includes(searchLower)
        );
    }
    
    if (filter.category && filter.category !== '') {
        filteredData = filteredData.filter(r => r.category === filter.category);
    }
    
    // Paginate
    const startIdx = (page - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    const pageData = filteredData.slice(startIdx, endIdx);
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    
    // Populate table
    const tbody = document.getElementById('reward-tbody');
    if (tbody) {
        tbody.innerHTML = pageData.map(reward => `
            <tr>
                <td class="reward-id">${reward.id}</td>
                <td>${reward.name}</td>
                <td><span class="category-badge">${reward.category}</span></td>
                <td>${reward.merchant}</td>
                <td>RM ${reward.value.toFixed(2)}</td>
                <td><strong>${reward.pointsRequired}</strong></td>
                <td>${reward.expiryDate}</td>
                <td>${reward.adminId}</td>
                <td class="actions-col">
                    <a href="#" class="view-action" onclick="viewRewardDetails('${reward.id}'); return false;" title="View details"><i class="fas fa-eye"></i></a>
                    <a href="#" class="edit-action" onclick="editReward('${reward.id}'); return false;" title="Edit reward"><i class="fas fa-edit"></i></a>
                    <a href="#" class="delete-action" onclick="deleteReward('${reward.id}'); return false;" title="Delete reward"><i class="fas fa-trash-alt"></i></a>
                </td>
            </tr>
        `).join('');
    }
    
    // Update entries info
    const entriesInfo = document.getElementById('reward-entries-info');
    if (entriesInfo) {
        entriesInfo.textContent = `Showing ${startIdx + 1} to ${Math.min(endIdx, filteredData.length)} of ${filteredData.length} entries`;
    }
    
    // Update pagination
    updateRewardPagination('reward-pagination', totalPages, page, (p) => loadRewardsTable(p, itemsPerPage, filter));
}

// Update pagination buttons
function updateRewardPagination(elementId, totalPages, currentPage, callback) {
    const pagination = document.getElementById(elementId);
    if (!pagination) return;
    
    pagination.innerHTML = '';
    
    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
        btn.textContent = i;
        btn.addEventListener('click', () => callback(i));
        pagination.appendChild(btn);
    }
}

// Setup reward page event listeners
function setupRewardEventListeners() {
    const rewardSearch = document.getElementById('reward-search');
    const categoryFilter = document.getElementById('reward-category-filter');
    const addNewBtn = document.getElementById('reward-add-new');
    const exportBtn = document.getElementById('reward-export');
    
    if (rewardSearch) {
        rewardSearch.addEventListener('input', () => loadRewardsTable(1, 10, { search: rewardSearch.value, category: categoryFilter?.value || '' }));
    }
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', () => loadRewardsTable(1, 10, { search: rewardSearch?.value || '', category: categoryFilter.value }));
    }
    
    if (addNewBtn) {
        addNewBtn.addEventListener('click', () => {
            openAddRewardModal();
        });
    }
    
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            exportRewardsToPDF();
        });
    }
}

// Current reward being viewed/edited
let currentRewardId = null;

// View reward details
function viewRewardDetails(rewardId) {
    const reward = rewardsData.find(r => r.id === rewardId);
    if (reward) {
        currentRewardId = rewardId;
        document.getElementById('view-reward-id').textContent = reward.id;
        document.getElementById('view-reward-name').textContent = reward.name;
        document.getElementById('view-reward-category').textContent = reward.category;
        document.getElementById('view-reward-merchant').textContent = reward.merchant;
        document.getElementById('view-reward-value').textContent = `RM ${reward.value.toFixed(2)}`;
        document.getElementById('view-reward-points').textContent = reward.pointsRequired;
        document.getElementById('view-reward-expiry').textContent = reward.expiryDate;
        document.getElementById('view-reward-admin').textContent = reward.adminId;
        
        const modal = document.getElementById('view-reward-modal');
        if (modal) {
            modal.classList.add('show');
        }
    }
}

// Close view modal
function closeViewModal() {
    const modal = document.getElementById('view-reward-modal');
    if (modal) {
        modal.classList.remove('show');
    }
    currentRewardId = null;
}

// Open edit modal from view modal
function openEditModalFromView() {
    closeViewModal();
    if (currentRewardId) {
        editReward(currentRewardId);
    }
}

// Edit reward
function editReward(rewardId) {
    const reward = rewardsData.find(r => r.id === rewardId);
    if (reward) {
        currentRewardId = rewardId;
        document.getElementById('edit-reward-id').value = reward.id;
        document.getElementById('edit-reward-name').value = reward.name;
        document.getElementById('edit-reward-category').value = reward.category;
        document.getElementById('edit-reward-merchant').value = reward.merchant;
        document.getElementById('edit-reward-value').value = reward.value;
        document.getElementById('edit-reward-points').value = reward.pointsRequired;
        document.getElementById('edit-reward-expiry').value = reward.expiryDate;
        document.getElementById('edit-reward-admin').value = reward.adminId;
        
        const modal = document.getElementById('edit-reward-modal');
        if (modal) {
            modal.classList.add('show');
        }
    }
}

// Close edit modal
function closeEditModal() {
    const modal = document.getElementById('edit-reward-modal');
    if (modal) {
        modal.classList.remove('show');
    }
    currentRewardId = null;
}

// Save reward changes
function saveRewardChanges() {
    if (!currentRewardId) return;
    
    const form = document.getElementById('edit-reward-form');
    if (!form.checkValidity()) {
        alert('Please fill in all required fields correctly.');
        return;
    }
    
    const rewardIdx = rewardsData.findIndex(r => r.id === currentRewardId);
    if (rewardIdx > -1) {
        rewardsData[rewardIdx] = {
            id: document.getElementById('edit-reward-id').value,
            name: document.getElementById('edit-reward-name').value,
            category: document.getElementById('edit-reward-category').value,
            merchant: document.getElementById('edit-reward-merchant').value,
            value: parseFloat(document.getElementById('edit-reward-value').value),
            pointsRequired: parseInt(document.getElementById('edit-reward-points').value),
            expiryDate: document.getElementById('edit-reward-expiry').value,
            adminId: document.getElementById('edit-reward-admin').value
        };
        
        closeEditModal();
        loadRewardsTable();
        // Show success message
        const successMsg = document.createElement('div');
        successMsg.className = 'success-toast';
        successMsg.innerHTML = '<i class="fas fa-check-circle"></i> Reward updated successfully!';
        document.body.appendChild(successMsg);
        setTimeout(() => successMsg.remove(), 3000);
    }
}

// Delete reward
function deleteReward(rewardId) {
    if (confirm(`Are you sure you want to delete reward ${rewardId}?`)) {
        const idx = rewardsData.findIndex(r => r.id === rewardId);
        if (idx > -1) {
            rewardsData.splice(idx, 1);
            loadRewardsTable();
            // Show success message
            const successMsg = document.createElement('div');
            successMsg.className = 'success-toast';
            successMsg.innerHTML = '<i class="fas fa-check-circle"></i> Reward deleted successfully!';
            document.body.appendChild(successMsg);
            setTimeout(() => successMsg.remove(), 3000);
        }
    }
}

// Close modals when clicking outside
document.addEventListener('click', function(event) {
    const viewModal = document.getElementById('view-reward-modal');
    const editModal = document.getElementById('edit-reward-modal');
    const redemptionModal = document.getElementById('view-redemption-modal');
    
    if (viewModal && event.target === viewModal) {
        closeViewModal();
    }
    if (editModal && event.target === editModal) {
        closeEditModal();
    }
    if (redemptionModal && event.target === redemptionModal) {
        closeRedemptionModal();
    }
});

// ==================== REDEMPTION TRACKING FUNCTIONS ====================

// Switch between tabs
function switchTab(tabName) {
    // Hide all tabs
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    // Remove active class from buttons
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    // Show selected tab
    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Mark button as active
    const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    // Load data for the selected tab
    if (tabName === 'rewards-tab') {
        loadRewardsTable();
    } else if (tabName === 'redemption-tab') {
        loadRedemptionsTable();
    }
}

// Initialize redemption page
function initializeRedemptionPage() {
    loadRedemptionsTable();
    setupRedemptionEventListeners();
}

// Load redemptions table
function loadRedemptionsTable(page = 1, itemsPerPage = 10, filter = {}) {
    let filteredData = redemptionsData;
    
    // Apply filters
    if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        filteredData = filteredData.filter(r => 
            r.id.toLowerCase().includes(searchLower) || 
            r.promoCode.toLowerCase().includes(searchLower) ||
            r.householdId.toLowerCase().includes(searchLower)
        );
    }
    
    if (filter.status && filter.status !== '') {
        filteredData = filteredData.filter(r => r.status === filter.status);
    }
    
    // Paginate
    const startIdx = (page - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    const pageData = filteredData.slice(startIdx, endIdx);
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    
    // Populate table
    const tbody = document.getElementById('redemption-tbody');
    if (tbody) {
        tbody.innerHTML = pageData.map(redemption => {
            let statusClass = 'status-' + redemption.status.toLowerCase();
            return `
            <tr>
                <td class="redemption-id">${redemption.id}</td>
                <td>${new Date(redemption.dateTime).toLocaleString()}</td>
                <td>${redemption.rewardId}</td>
                <td>${redemption.householdId}</td>
                <td><code class="promo-code">${redemption.promoCode}</code></td>
                <td>${redemption.pointsDeducted}</td>
                <td><span class="status-badge ${statusClass}">${redemption.status}</span></td>
                <td class="actions-col">
                    <a href="#" class="view-action" onclick="viewRedemptionDetails('${redemption.id}'); return false;" title="View details"><i class="fas fa-eye"></i></a>
                </td>
            </tr>
        `}).join('');
    }
    
    // Update entries info
    const entriesInfo = document.getElementById('redemption-entries-info');
    if (entriesInfo) {
        entriesInfo.textContent = `Showing ${startIdx + 1} to ${Math.min(endIdx, filteredData.length)} of ${filteredData.length} entries`;
    }
    
    // Update pagination
    updateRedemptionPagination('redemption-pagination', totalPages, page, (p) => loadRedemptionsTable(p, itemsPerPage, filter));
}

// Update redemption pagination
function updateRedemptionPagination(elementId, totalPages, currentPage, callback) {
    const pagination = document.getElementById(elementId);
    if (!pagination) return;
    
    pagination.innerHTML = '';
    
    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
        btn.textContent = i;
        btn.addEventListener('click', () => callback(i));
        pagination.appendChild(btn);
    }
}

// Setup redemption event listeners
function setupRedemptionEventListeners() {
    const redemptionSearch = document.getElementById('redemption-search');
    const statusFilter = document.getElementById('redemption-status-filter');
    const exportBtn = document.getElementById('redemption-export');
    
    if (redemptionSearch) {
        redemptionSearch.addEventListener('input', () => loadRedemptionsTable(1, 10, { search: redemptionSearch.value, status: statusFilter?.value || '' }));
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', () => loadRedemptionsTable(1, 10, { search: redemptionSearch?.value || '', status: statusFilter.value }));
    }
    
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            exportRedemptionsToCSV();
        });
    }
}

// View redemption details
function viewRedemptionDetails(redemptionId) {
    const redemption = redemptionsData.find(r => r.id === redemptionId);
    if (redemption) {
        document.getElementById('view-redemption-id').textContent = redemption.id;
        document.getElementById('view-redemption-status').innerHTML = `<span class="status-badge status-${redemption.status.toLowerCase()}">${redemption.status}</span>`;
        document.getElementById('view-redemption-datetime').textContent = new Date(redemption.dateTime).toLocaleString();
        document.getElementById('view-redemption-reward-id').textContent = redemption.rewardId;
        document.getElementById('view-redemption-household-id').textContent = redemption.householdId;
        document.getElementById('view-redemption-points').textContent = redemption.pointsDeducted + ' points';
        document.getElementById('view-redemption-promo').innerHTML = `<code class="promo-code">${redemption.promoCode}</code>`;
        
        const modal = document.getElementById('view-redemption-modal');
        if (modal) {
            modal.classList.add('show');
        }
    }
}

// Export redemptions to CSV
function exportRedemptionsToCSV() {
    try {
        // Collect visible rows from redemption table
        const rows = Array.from(document.querySelectorAll('.redemption-table tbody tr'))
            .filter(r => r.style.display !== 'none');

        // CSV header
        const header = ['Redemption ID','Date & Time','Reward ID','Household ID','Promo Code','Points Deducted','Status'];

        const csvRows = [header.join(',')];

        rows.forEach(r => {
            const cells = Array.from(r.querySelectorAll('td'));
            // Take data cells (first 7 columns), ignore actions cell
            const dataCells = cells.slice(0, 7);
            const values = dataCells.map(c => '"' + c.textContent.trim().replace(/"/g, '""') + '"');
            csvRows.push(values.join(','));
        });

        const csv = csvRows.join('\n');

        // Create blob and trigger download
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'redemptions_export.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (err) {
        console.error('Export redemptions error:', err);
        alert('Export failed — see console');
    }
}

// Close redemption modal
function closeRedemptionModal() {
    const modal = document.getElementById('view-redemption-modal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// ==================== ADD NEW REWARD FUNCTION ====================

// Open add reward modal
function openAddRewardModal() {
    const modal = document.getElementById('add-reward-modal');
    if (modal) {
        document.getElementById('add-reward-form').reset();
        modal.classList.add('show');
    }
}

// Close add reward modal
function closeAddRewardModal() {
    const modal = document.getElementById('add-reward-modal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// Save new reward
function saveNewReward() {
    const form = document.getElementById('add-reward-form');
    if (!form.checkValidity()) {
        alert('Please fill in all required fields correctly.');
        return;
    }
    
    const newReward = {
        id: document.getElementById('new-reward-id').value.trim(),
        name: document.getElementById('new-reward-name').value.trim(),
        category: document.getElementById('new-reward-category').value,
        merchant: document.getElementById('new-reward-merchant').value.trim(),
        value: parseFloat(document.getElementById('new-reward-value').value),
        pointsRequired: parseInt(document.getElementById('new-reward-points').value),
        expiryDate: document.getElementById('new-reward-expiry').value,
        adminId: document.getElementById('new-reward-admin').value.trim()
    };
    
    // Check if reward ID already exists
    if (rewardsData.find(r => r.id === newReward.id)) {
        alert('Reward ID already exists. Please use a different ID.');
        return;
    }
    
    // Add to data array
    rewardsData.push(newReward);
    
    closeAddRewardModal();
    loadRewardsTable();
    
    // Show success message
    const successMsg = document.createElement('div');
    successMsg.className = 'success-toast';
    successMsg.innerHTML = '<i class="fas fa-check-circle"></i> New reward added successfully!';
    document.body.appendChild(successMsg);
    setTimeout(() => successMsg.remove(), 3000);
}

// ==================== EXPORT PDF FUNCTION ====================

// Export rewards to CSV (like household export)
function exportRewardsToPDF() {
    try {
        // Collect visible rows from reward table
        const rows = Array.from(document.querySelectorAll('.reward-table tbody tr'))
            .filter(r => r.style.display !== 'none');

        // CSV header
        const header = ['Reward ID','Name','Category','Merchant','Value (RM)','Points Required','Expiry Date','Admin ID'];

        const csvRows = [header.join(',')];

        rows.forEach(r => {
            const cells = Array.from(r.querySelectorAll('td'));
            // Take only data cells (first 8 columns), ignore actions cell
            const dataCells = cells.slice(0, 8);
            const values = dataCells.map(c => '"' + c.textContent.trim().replace(/"/g, '""') + '"');
            csvRows.push(values.join(','));
        });

        const csv = csvRows.join('\n');

        // Create blob and trigger download
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'rewards_export.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (err) {
        console.error('Export rewards error:', err);
        alert('Export failed — see console');
    }
}

// Close modals when clicking outside
document.addEventListener('click', function(event) {
    const viewModal = document.getElementById('view-reward-modal');
    const editModal = document.getElementById('edit-reward-modal');
    const redemptionModal = document.getElementById('view-redemption-modal');
    const addRewardModal = document.getElementById('add-reward-modal');
    
    if (viewModal && event.target === viewModal) {
        closeViewModal();
    }
    if (editModal && event.target === editModal) {
        closeEditModal();
    }
    if (redemptionModal && event.target === redemptionModal) {
        closeRedemptionModal();
    }
    if (addRewardModal && event.target === addRewardModal) {
        closeAddRewardModal();
    }
});
