# Stage 1

## Architecture & Priority Algorithms

### 1. Priority Score Algorithms (Weight Rules)
The requirement of the priority inbox logic is to sort continuous streams of notifications so the user perceives immediate critical updates without manually sorting them.
We've introduced a multi-variable sorting sequence:

1. **Category Weight Constraint:**
   - **Placement (Weight: 3)**
   - **Result (Weight: 2)**
   - **Event (Weight: 1)**
   
   Items are mapped against a predefined weighting dictionary and compared. By assigning fixed ordinal values to these states, the notification with the highest mapped category weight floats to the top.

2. **Temporal Constraint (Timestamp Fallback):**
   - If two notifications share an identical category weight (e.g. two `Placement` notifications), the algorithm defaults to sorting by parsing the `Timestamp` attribute recency. The items are sorted in descending order ensuring the newest items surface.

### 2. Architectural Scaling Approach
To keep the application highly responsive and stable within standard client side boundaries—especially when processing continuous, live notification payloads—we adopted the following structural standards:

- **Server-Side Pagination & Filtering:**
  Rather than transmitting the whole database list locally, we utilize structured query parameters (`limit`, `page`, and `notification_type`). This ensures memory footprint remains low, bandwidth costs are reduced, and frontend DOM renders don't get throttled with heavy lists.
  
- **Optimistic Unread State Handling:**
  To distinguish viewed from unviewed alerts efficiently, the frontend employs a `readState` hashed dictionary mapped locally in the component. Clicking "Mark Read" instantly modifies the visual state in O(1) time without forcing synchronous network updates or expensive component tree refetches, providing a smooth user experience.

- **Independent Middleware Metrics Layer:**
  A separate localized `logging_middleware` acts transversally on HTTP requests, decoupling infrastructure tracking from application logic and keeping endpoint handlers concise.
