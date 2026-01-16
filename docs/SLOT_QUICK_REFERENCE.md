# Slot Management System - Quick Reference Card

## ⚡ Quick Start (2 minutes)

### Access
```
URL: /client/turfs/:turfId/slots
Role: Client (Turf Owner)
```

### Create Single Slot
```
1. Fill form:
   - Start Time: 06:00
   - End Time: 07:00  
   - Price: 1200
   
2. Click "Add Slot"
3. ✅ Success toast appears
4. Slot added to list
```

### Create Bulk Slots
```
1. Click "Bulk Create" button
2. Fill form:
   - Start: 06:00, End: 23:00
   - Duration: 60 min
   - Days: 7
   - Price: 1200
   
3. Preview shows ~119 slots
4. Click "Create Slots"
5. ✅ All slots created
```

---

## 🔍 Key Commands

| Action | Steps |
|--------|-------|
| **Add Slot** | Fill form → Click "Add Slot" |
| **Edit Slot** | Click pencil icon → Modify → Click "Save" |
| **Delete Slot** | Click trash icon → Confirm |
| **Bulk Create** | Click "Bulk Create" → Fill → Create |
| **View All** | Scroll down to see all slots |

---

## ✅ Validation Rules

| Field | Rule | Example |
|-------|------|---------|
| Start Time | Must be before end time | 06:00 ✅ |
| End Time | Must be after start time | 07:00 ✅ |
| Duration | 30 min - 8 hours | 60 min ✅ |
| Price | Must be > 0 | ₹1200 ✅ |
| Overlap | No overlapping slots | 06:00-07:00 + 07:00-08:00 ✅ |

### ❌ Invalid Examples
```
06:00 - 06:00    ❌ Same time
08:00 - 07:00    ❌ End before start
06:00 - 06:15    ❌ Too short (< 30 min)
06:00 - 15:00    ❌ Too long (> 8 hours)
0 or -100        ❌ Invalid price
```

---

## 📊 Status Display

```
Available  → Green badge, Green border
Booked     → Red badge, Red border
Cannot Edit Booked Slots
Cannot Delete Booked Slots
```

---

## 🔔 Toast Messages

| Message | Type | Action |
|---------|------|--------|
| "Slot created: 06:00 - 07:00" | Success ✅ | Auto-dismisses |
| "Slot updated successfully" | Success ✅ | Auto-dismisses |
| "Slot deleted successfully" | Success ✅ | Auto-dismisses |
| "Created 50 slots" | Success ✅ | Auto-dismisses |
| "Start time must be before end time" | Error ❌ | Auto-dismisses |
| "This slot overlaps with an existing slot" | Error ❌ | Auto-dismisses |

---

## 📈 Summary Statistics

Shows at bottom:
```
Total: 50 slots
Available: 45 slots (Green)
Booked: 5 slots (Red)
Avg Price: ₹1300
```

---

## 🎯 Common Use Cases

### Morning Slots (6 AM - 2 PM)
```
Start: 06:00
End: 14:00
Duration: 60 min
Days: 1
Result: 8 slots
```

### Afternoon Slots (2 PM - 10 PM)
```
Start: 14:00
End: 22:00
Duration: 60 min
Days: 1
Result: 8 slots
```

### Weekly Setup (30-min slots)
```
Start: 06:00
End: 23:00
Duration: 30 min
Days: 7
Result: 238 slots
```

### Monthly Setup (1-hour slots)
```
Start: 06:00
End: 23:00
Duration: 60 min
Days: 30
Result: 510 slots
```

---

## 🔧 API Endpoints

```
GET    /api/slots/:turfId       → Load slots
POST   /api/slots               → Create slot
PUT    /api/slots/:id           → Update slot
DELETE /api/slots/:id           → Delete slot
```

---

## 🔒 Permissions

```
Can Create:  ✅ Client (Turf Owner)
Can Edit:    ✅ Unbooked slots only
Can Delete:  ✅ Unbooked slots only
Can View:    ✅ Everyone
Can Book:    ✅ Players only
```

---

## ⚠️ Limits

| Item | Limit |
|------|-------|
| Min Duration | 30 minutes |
| Max Duration | 8 hours |
| Max Bulk Days | 30 days |
| Max Slots/Op | ~210 |
| Price | Any positive number |

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Slots not loading | Check API endpoint is working |
| Cannot create | Check all fields are filled |
| Overlap error | Times overlap with existing slot |
| Cannot edit booked | Booked slots are locked |
| Toast not showing | Check CSS animations enabled |
| Form not clearing | Refresh page and retry |

---

## 📱 Device Support

```
Mobile   (< 768px)  ✅ Full support
Tablet   (768-1024) ✅ Full support
Desktop  (> 1024px) ✅ Full support
```

---

## 🎨 Colors Reference

```
Available: Green (#10B981)
Booked:    Red (#EF4444)
Success:   Green (#16A34A)
Error:     Red (#DC2626)
Primary:   Blue (#2563EB)
```

---

## 📚 Documentation Files

```
SLOT_MANAGEMENT_GUIDE.md      → Technical details
SLOT_TESTING_GUIDE.md          → Testing procedures
SLOT_IMPLEMENTATION_COMPLETE.md → Full summary
SLOT_QUICK_REFERENCE.md        → This file
```

---

## 🚀 Deployment Checklist

- [ ] All API endpoints working
- [ ] Database configured
- [ ] Form validation working
- [ ] Toast notifications visible
- [ ] Responsive design tested
- [ ] Error handling tested
- [ ] Load slots on page visit
- [ ] Can create/edit/delete slots
- [ ] Summary statistics correct
- [ ] Ready for players to book

---

## 🎯 Next: Player Side

Once slots are created, players can:
1. Visit turf detail page
2. See available slots
3. Select slots
4. Book and pay
5. Confirm booking

All integrated with Razorpay payment!

---

## 💡 Pro Tips

1. **Setup First**: Create all slots before launch
2. **Price Tiers**: Different prices for different times
3. **Bulk Create**: Save time with bulk feature
4. **Monitor**: Check available vs booked ratio
5. **Edit Prices**: Adjust based on demand

---

## ❓ FAQs

**Q: Can I edit booked slots?**
A: No, only unbooked slots can be edited

**Q: Can I create overlapping slots?**
A: No, system prevents overlaps

**Q: What's the minimum slot duration?**
A: 30 minutes

**Q: Can I bulk create different prices?**
A: No, all bulk slots have same price

**Q: How many slots can I create?**
A: Unlimited (but bulk limit 30 days)

**Q: Can players see slots on detail page?**
A: Yes, after they're created here

---

## 📞 Support

- Technical: SLOT_MANAGEMENT_GUIDE.md
- Testing: SLOT_TESTING_GUIDE.md
- Code: Comments in TurfSlotsPage.tsx

---

**Status**: ✅ PRODUCTION READY

**Last Updated**: 2025-12-28

**Version**: 1.0
