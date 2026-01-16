# Slot Management System - Testing Guide

## Quick Start

### Prerequisites
- Logged in as client/turf owner
- Have at least one turf created
- Backend API endpoints working

### Access Slot Management
1. Login to your account (role: client)
2. Go to Client Dashboard
3. Click on any turf
4. Click "Manage Slots" button

OR

Navigate directly to: `/client/turfs/:turfId/slots`

## Testing Scenarios

### Scenario 1: Create a Single Slot

**Steps:**
1. Go to Manage Slots page
2. In "Add New Slot" form:
   - Start Time: `06:00`
   - End Time: `07:00`
   - Price: `1200`
3. Click "Add Slot"

**Expected Results:**
- ✅ Green success toast: "Success: Slot created: 06:00 - 07:00"
- ✅ Slot appears in slots list
- ✅ Form clears after submission
- ✅ Slot shows as "Available" (green badge)
- ✅ Duration shown as "1 hour"

---

### Scenario 2: Create Slot with Invalid Data

**Test 2a: Start time same as end time**
- Start Time: `06:00`
- End Time: `06:00`
- Expected: ❌ Error: "Start time must be before end time"

**Test 2b: End time before start time**
- Start Time: `08:00`
- End Time: `07:00`
- Expected: ❌ Error: "Start time must be before end time"

**Test 2c: Duration less than 30 minutes**
- Start Time: `06:00`
- End Time: `06:15`
- Expected: ❌ Error: "Minimum slot duration is 30 minutes"

**Test 2d: Duration more than 8 hours**
- Start Time: `06:00`
- End Time: `15:00` (9 hours)
- Expected: ❌ Error: "Maximum slot duration is 8 hours"

**Test 2e: Negative or zero price**
- Price: `0` or `-100`
- Expected: ❌ Error: "Price must be greater than 0"

---

### Scenario 3: Create Overlapping Slots

**Steps:**
1. Create first slot: `06:00 - 07:00` (Price: 1200)
2. Try to create: `06:30 - 07:30` (Price: 1200)

**Expected Results:**
- ✅ First slot created successfully
- ❌ Second slot fails: "This time slot overlaps with an existing slot"

**Alternative tests:**
- `06:00 - 07:00` then `07:00 - 08:00` → ✅ Both should succeed (no overlap)
- `06:00 - 08:00` then `06:30 - 07:00` → ❌ Second fails (overlaps)

---

### Scenario 4: Bulk Create Slots

**Steps:**
1. Click "Bulk Create" button
2. Set values:
   - Start Time: `06:00`
   - End Time: `23:00`
   - Slot Duration: `60` (minutes)
   - Number of Days: `1`
   - Price: `1200`
3. See preview: "Will create approximately 17 slots"
4. Click "Create Slots"

**Expected Results:**
- ✅ Green success toast: "Success: Created 17 slots"
- ✅ All 17 slots appear in list (from 6 AM to 11 PM)
- ✅ All slots show as "Available"
- ✅ Form closes automatically

---

### Scenario 5: Bulk Create with Multiple Days

**Steps:**
1. Click "Bulk Create" button
2. Set values:
   - Start Time: `07:00`
   - End Time: `18:00` (11 AM to 6 PM)
   - Slot Duration: `60` (1 hour)
   - Number of Days: `7`
   - Price: `1500`
3. See preview: "Will create approximately 77 slots"
4. Click "Create Slots"

**Expected Results:**
- ✅ Green success toast: "Success: Created 77 slots"
- ✅ 77 new slots created (7 days × 11 slots/day)
- ✅ All slots show as "Available"

---

### Scenario 6: Edit a Slot

**Steps:**
1. Find an unbooked slot in the list
2. Click the edit icon (pencil)
3. Modify:
   - Start Time: `06:00` → `06:30`
   - End Time: `07:00` → `07:30`
   - Price: `1200` → `1300`
4. Click "Save"

**Expected Results:**
- ✅ Green success toast: "Success: Slot updated successfully"
- ✅ Slot now shows new times and price
- ✅ Form closes

---

### Scenario 7: Edit Slot Validation

**Test 7a: Create invalid overlap while editing**
- Existing slots: `06:00-07:00`, `07:00-08:00`
- Edit first slot to: `06:30-08:00`
- Expected: ❌ Error: "This time slot overlaps with another slot"

**Test 7b: Invalid time range**
- Edit slot to have end time before start time
- Expected: ❌ Error displayed

---

### Scenario 8: Delete a Slot

**Steps:**
1. Find an available (unbooked) slot
2. Click the trash icon
3. Confirm deletion in dialog

**Expected Results:**
- ✅ Confirmation dialog appears: "Are you sure..."
- ✅ Slot deleted after confirmation
- ✅ Green success toast: "Success: Slot deleted successfully"
- ✅ Slot disappears from list
- ✅ Summary statistics update

---

### Scenario 9: Booked Slot Behavior

**Note:** Booked slots cannot be edited or deleted

**Steps:**
1. Create a slot
2. (Simulate booking from player side)
3. In slot list, booked slot shows:
   - Red badge: "Booked"
   - Red background color
   - No edit/delete buttons
   - Message: "Cannot edit booked slot"

**Expected Results:**
- ✅ No action buttons visible for booked slots
- ✅ Visual distinction (red) from available slots
- ✅ Cannot attempt to edit

---

### Scenario 10: Summary Statistics

**Steps:**
1. Create several slots (mix of statuses)
2. Scroll to bottom of page

**Expected Results:**
- ✅ Total Slots: Total count
- ✅ Available: Count of non-booked
- ✅ Booked: Count of booked
- ✅ Avg Price: Average price of all slots

**Example:**
- Created 10 slots at ₹1200 each
- 3 booked, 7 available
- Summary shows:
  - Total: 10
  - Available: 7
  - Booked: 3
  - Avg Price: ₹1200

---

## Edge Cases & Advanced Tests

### Test A: Very Long Slot Duration
- Start Time: `06:00`
- End Time: `14:00` (8 hours)
- Expected: ✅ Allowed (maximum)

- Start Time: `06:00`
- End Time: `14:01` (8 hours 1 min)
- Expected: ❌ Error: "Maximum slot duration is 8 hours"

### Test B: Minimum Duration Edge Case
- Start Time: `06:00`
- End Time: `06:30` (30 minutes)
- Expected: ✅ Allowed (minimum)

- Start Time: `06:00`
- End Time: `06:29` (29 minutes)
- Expected: ❌ Error: "Minimum slot duration is 30 minutes"

### Test C: Bulk Creation Limit
- Number of Days: `31`
- Expected: ❌ Error: "Cannot create slots for more than 30 days at once"

### Test D: Empty Form Fields
- Click "Add Slot" without filling any field
- Expected: ❌ Error: "All fields are required"

### Test E: Time Format Edge Cases
- Start Time: `23:30`
- End Time: `23:59`
- Expected: ✅ Allowed (30 minutes slot)

- Start Time: `23:30`
- End Time: `23:45`
- Expected: ✅ Allowed

- Start Time: `00:00`
- End Time: `00:30`
- Expected: ✅ Allowed (midnight slots)

### Test F: Large Price Values
- Price: `100000` (₹100,000)
- Expected: ✅ Accepted

- Price: `0.50` (50 paise)
- Expected: ✅ Accepted

- Price: `0`
- Expected: ❌ Error: "Price must be greater than 0"

---

## UI/UX Tests

### Responsive Design
- [ ] Test on mobile (375px width)
  - Form fields stack vertically
  - Buttons full width
  - Summary grid 2 columns
- [ ] Test on tablet (768px width)
  - Multi-column layout
  - Good spacing
- [ ] Test on desktop (1920px width)
  - All features visible
  - Proper alignment

### Loading States
- [ ] Create slot → Button shows "Creating..."
- [ ] Multiple slots loading → Spinner appears
- [ ] Bulk create → Progress indication

### Toast Notifications
- [ ] Success toast appears (green) and dismisses after 4 seconds
- [ ] Error toast appears (red) and dismisses after 4 seconds
- [ ] Multiple toasts stack properly
- [ ] Toast text is readable
- [ ] Toast disappears on close button click (if implemented)

### Form Interactions
- [ ] Form clears after successful submission
- [ ] Error message appears immediately when typing invalid data
- [ ] Error message disappears when starting to correct
- [ ] Back button navigates to previous page
- [ ] Page loads slots on first visit

### Visual Elements
- [ ] Slot cards show all information clearly
- [ ] Available/Booked badges are distinct
- [ ] Icons are visible and appropriate
- [ ] Color scheme is consistent
- [ ] Text is readable (contrast)

---

## Performance Tests

### Load Performance
- [ ] Page loads in < 2 seconds with 100 slots
- [ ] Page loads in < 3 seconds with 1000 slots
- [ ] Form validation is instant (< 50ms)
- [ ] Toast animation is smooth (0.3s)

### Creation Performance
- [ ] Single slot creation: ~1-2 seconds
- [ ] Bulk slot creation (50 slots): ~10-20 seconds
- [ ] No UI freeze during operations

---

## API Integration Tests

### Test API Calls
- [ ] GET `/slots/:turfId` returns correct data
- [ ] POST `/slots` creates slot successfully
- [ ] PUT `/slots/:id` updates slot
- [ ] DELETE `/slots/:id` deletes slot

### Error Handling
- [ ] Network error → Toast with error message
- [ ] 401 Unauthorized → Redirect to login
- [ ] 404 Not Found → Error message shown
- [ ] 500 Server Error → Toast with error

### Data Integrity
- [ ] Created slots match input values
- [ ] Edited slots reflect changes
- [ ] Deleted slots no longer appear
- [ ] Concurrent operations don't cause conflicts

---

## Accessibility Tests

- [ ] All form inputs have labels
- [ ] Tab navigation works
- [ ] Keyboard Enter submits forms
- [ ] Error messages are read out by screen readers
- [ ] Status badges use both color and text
- [ ] Focus indicators are visible

---

## Common Issues & Debugging

### Issue: Slots not appearing after creation
**Debug:**
1. Open DevTools (F12)
2. Go to Network tab
3. Check if POST request succeeded (201/200)
4. Check if GET request was made after creation
5. Check if response has slot data

### Issue: Bulk creation creating fewer slots than expected
**Debug:**
1. Verify duration value is correct
2. Check if overlapping slots are being prevented
3. Look at success toast message for actual count

### Issue: Form not clearing after submission
**Debug:**
1. Check if form state is being reset
2. Check browser console for errors
3. Verify loadSlots() is being called

### Issue: Toast notifications not appearing
**Debug:**
1. Check if animations are enabled in Tailwind
2. Check browser console for errors
3. Verify CSS is loaded
4. Check z-index (should be 50)

---

## Sign-Off Checklist

Before marking as complete:

- [ ] All scenarios tested successfully
- [ ] No console errors
- [ ] Responsive design works
- [ ] Toast notifications appear
- [ ] Validation works correctly
- [ ] API integration successful
- [ ] Can create single slot
- [ ] Can create bulk slots
- [ ] Can edit existing slot
- [ ] Can delete available slot
- [ ] Cannot delete booked slot
- [ ] Cannot edit booked slot
- [ ] Summary statistics correct
- [ ] UI aligns properly
- [ ] Performance acceptable
- [ ] Error messages clear
- [ ] Loading states visible
- [ ] Page loads on first visit
- [ ] Back button works
- [ ] Ready for production

---

## Notes

- Test with fresh database to avoid slot conflicts
- Test both with and without existing slots
- Test with different price ranges
- Test on different browsers and devices
- Test network failures (use DevTools throttling)
- Test with slow API responses

## Success Criteria

✅ All tests pass
✅ No console errors
✅ User-friendly error messages
✅ Smooth UI animations
✅ Responsive on all devices
✅ Performance within acceptable range
✅ API integration working
✅ Comprehensive validation
✅ Toast notifications functional
✅ Ready for player slot booking
