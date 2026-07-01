# Security Specification: QuickNow Customer Registration System

## 1. Data Invariants

1. **Identity Bound**: A user can only read, write, or delete their own user profile document. `/users/{userId}` requires `{userId}` to match `request.auth.uid`.
2. **PII Protection**: User profile data (like email, phone, addresses) is strictly restricted to the resource owner or an authenticated admin. No blanket reads of the users collection.
3. **Immutable Auditing**: `createdAt` and `customerId` are set on document creation and are immutable during any subsequent updates.
4. **Time Sync**: `createdAt` and `lastLogin` must strictly align with `request.time` (the server's timestamp).
5. **Role Lockdown**: Only admins or internal system lookups can modify roles. Standard customers cannot modify their `role` field.
6. **Unique ID & Verification Check**: Writes to the `/users/{userId}` document must verify that the user is authenticated, and standard write operations check that `email_verified == true` (if email auth is used) or custom phone verification conditions.
7. **Address Subcollection Isolation**: Address sub-documents `/users/{userId}/addresses/{addressId}` are strictly owned by the corresponding `{userId}` and can only be modified by that owner.
8. **Field Size and Character Validation**: All text fields like `name`, `phone`, `houseFlat` are restricted in length to prevent "Denial of Wallet" size exploitation.

---

## 2. The "Dirty Dozen" Payloads (Exploit Vector Mockups)

Below are 12 JSON payloads designed to attempt to break Identity, Integrity, and State:

1. **Role Escalation**: Standard user attempting to create/update profile with `"role": "admin"`.
2. **Identity Spoofing**: User `A` trying to write a profile under path `/users/UserB`.
3. **Ghost Address Insertion**: Inserting an address under User B's subcollection `/users/UserB/addresses/addr1` as User A.
4. **ID Poisoning Attack**: Submitting an address with an ID containing special characters/massive strings to exhaust resources.
5. **Immutable Date Overwrite**: Overwriting `createdAt` from `2026-06-01` to `2022-01-01` to cheat system age or eligibility.
6. **Negative Wallet Invariant**: Trying to set `walletBalance` to negative or a massive amount (`"walletBalance": 1000000`).
7. **Bypass Admin Block**: Standard blocked user setting their own `status` back to `"Active"`.
8. **Self-Assigned Reward Points**: A client payload trying to set `"loyaltyPoints": 999999`.
9. **Duplicate Customer ID Generation**: Attempting to reuse an existing Customer ID (`"customerId": "QN000001"`) on multiple profiles.
10. **Shadow Field Injection**: Adding custom metadata keys to profile (`"hacker_backdoor": true`) to bypass strict size checks.
11. **Malicious GPS Manipulation**: Injecting extreme floats (`latitude: 9999.9`) to break geo-sorting algorithms.
12. **Blanket Query Scraping**: Attempting to query `getDocs(collection(db, 'users'))` with no filter to scrape all user profiles.

---

## 3. The Test Runner Spec

Our rule set will be validated using standard Firestore emulator behaviors, rejecting all the above Dirty Dozen payloads with `PERMISSION_DENIED` while permitting valid user registration and address creation flows.
