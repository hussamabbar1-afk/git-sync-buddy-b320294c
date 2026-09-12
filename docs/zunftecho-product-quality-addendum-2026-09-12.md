ADD THIS AS A NON-DISRUPTIVE PRODUCT-QUALITY TASK UNDER THE EXISTING ZUNFTECHO MASTER OPERATING DIRECTIVE.

IMPORTANT — CONTINUITY FIRST

This instruction is additive only.

Do NOT interrupt, cancel, restart, replace, shorten, or unnecessarily reprioritize:
- the task currently in progress,
- the execution plan you are already following,
- any already-planned follow-up steps,
- the existing growth/sales/marketing strategy,
- the current project autonomy model,
- the permissions you already have,
- or the existing ZunftEcho source of truth.

Finish the currently active execution sequence first unless you independently determine that one of the issues below is materially blocking demos, prospects, conversions, customer use, or revenue.

Then place this task at the earliest rational point in the existing priority queue.

Do not ask me when to execute it. Evaluate its business impact yourself and prioritize it appropriately under the existing Master Operating Directive.

This is a targeted quality improvement, NOT a return to open-ended product development.


==================================================
ISSUE A — CHAT WIDGET MOBILE UX
==================================================

I inspected the current ZunftEcho chat interface on a smartphone.

The usable conversation area is too small.

The current permanent controls for:

- "Meinen Standort teilen"
- "Adresse eingeben"
- "Foto anhängen"

consume too much vertical space.

As a result, the actual conversation becomes compressed, especially on mobile.

I am attaching a screenshot that demonstrates the problem.

The chat itself must be the dominant part of the interface.


==================================================
UX OBJECTIVE
==================================================

Keep ALL existing functionality:

- location sharing
- manual address entry
- photo attachment
- message composer
- conversation history

but redesign how the secondary actions are presented.

The visual priority should be:

1. Conversation history
2. Message composer
3. Secondary actions such as location/address/photo

Secondary actions should remain easy to discover and use without permanently occupying a large portion of the viewport.

Inspect the actual implementation before choosing a solution.

Possible patterns to evaluate include:

- compact icon actions beside the composer
- a "+" action button
- expandable action menu
- bottom sheet
- compact toolbar
- collapsible secondary controls
- another cleaner responsive pattern that fits the existing ZunftEcho design system

Do NOT blindly implement a specific pattern from this prompt.

Choose the solution that produces the best usability with the smallest clean change.


==================================================
MOBILE UX REQUIREMENTS
==================================================

Verify the real customer-facing widget, not only the internal Testchat.

Determine whether Testchat and the embedded customer widget share the same component.

If they share implementation:
fix the shared component correctly.

If they are different:
ensure the customer-facing widget receives equivalent quality.

Test at minimum:

- small smartphone widths
- normal smartphones
- large smartphones
- iPhone/Safari behavior
- Android-like mobile widths where possible
- tablet
- desktop embedded widget
- internal Testchat

Pay attention to:

- viewport height
- mobile browser chrome
- iOS safe areas
- virtual keyboard opening
- composer visibility
- scrolling
- long messages
- multiple previous messages
- attachment controls
- location permissions
- responsive layout


==================================================
UX ACCEPTANCE CRITERIA
==================================================

The finished interface should provide:

- substantially more visible conversation area
- natural message scrolling
- a clearly accessible composer
- secondary actions that are available but not visually dominant
- no loss of location functionality
- no loss of address functionality
- no loss of image upload
- no overlap
- no clipping
- no controls hidden behind mobile browser UI
- no broken keyboard behavior
- no desktop regression
- no unnecessary clutter
- consistent ZunftEcho styling
- intuitive use without explanation

Do not merely make the widget taller if that creates new embedding or mobile problems.

Fix the information hierarchy properly.


==================================================
ISSUE B — AI RESPONSE LATENCY
==================================================

The AI chat response still feels noticeably slow.

Treat this as a real performance investigation.

Do NOT solve it by blindly switching to a weaker model or reducing answer quality.

MEASURE FIRST.

IMPORTANT ARCHITECTURE CORRECTION:

n8n is NOT part of the current production chat architecture.

Do not investigate, modify, optimize, or include n8n in this task.

The current chat system runs through the existing frontend/backend architecture and Supabase.

Do not assume the precise internal path from this prompt.

Inspect the actual implementation and reconstruct the real production request flow from the codebase and Supabase configuration.


==================================================
PERFORMANCE INVESTIGATION
==================================================

Trace the real path from:

User presses Send
→ frontend request
→ backend / Supabase Edge Function
→ authentication / company or tenant resolution
→ database/context retrieval
→ knowledge retrieval
→ prompt construction
→ AI/model request
→ any actual tool/function calls
→ response processing
→ persistence
→ frontend display

Instrument or inspect timing wherever reasonably possible.

Investigate:

- time from Send to backend receipt
- Edge Function execution time
- authentication overhead
- tenant/company resolution
- Supabase query latency
- RPC latency
- conversation-history retrieval
- customer-context retrieval
- knowledge retrieval
- prompt construction
- request payload size
- model time-to-first-token
- total model completion time
- additional model calls
- tool/function-call latency if actually present
- persistence latency
- Realtime/subscription behavior if used
- frontend buffering
- frontend rendering delay
- total time to first visible useful output


==================================================
LOOK FOR SPECIFIC BOTTLENECKS
==================================================

Inspect for issues such as:

- unnecessarily large conversation history
- unnecessary historical messages being sent to the model
- oversized knowledge context
- repeated retrieval of the same company data
- repeated tenant/company lookup
- redundant Supabase queries
- duplicated requests
- sequential operations that can safely run in parallel
- unnecessary model calls
- excessive reasoning for simple customer questions
- unnecessary network round trips
- slow Edge Function initialization
- inefficient RPC/database queries
- waiting for writes that do not need to block the visible response
- missing or ineffective streaming
- frontend buffering
- unnecessary response post-processing
- unnecessary serialization/deserialization
- retry behavior
- timeouts
- hidden failure/retry loops


==================================================
PRIMARY PERFORMANCE KPI
==================================================

Optimize primarily for:

TIME TO FIRST VISIBLE USEFUL RESPONSE

The user should feel that the assistant starts responding quickly.

Total completion time matters too, but perceived responsiveness is especially important in a customer chat.


==================================================
STREAMING
==================================================

Determine whether AI response streaming is currently implemented.

If not, evaluate whether the current architecture can safely stream the answer to the frontend.

If streaming is appropriate, design it so that:

- the user begins seeing the answer earlier,
- persistence remains reliable,
- incomplete/failed generations are handled correctly,
- existing message history remains consistent,
- no duplicate messages appear,
- tenant isolation remains intact,
- error handling remains professional.

Do not implement streaming merely because it sounds faster if the current architecture has a better solution.


==================================================
OPTIMIZATION PRINCIPLE
==================================================

After measurement:

1. identify the dominant latency contributors,
2. rank them by impact,
3. fix the highest-value bottlenecks first,
4. avoid broad refactoring,
5. measure again.

Potential improvements may include:

- parallelizing safe independent Supabase queries
- reducing redundant queries
- reducing unnecessary context
- better knowledge selection
- caching safe reusable data
- improving Edge Function logic
- reducing model round trips
- streaming
- moving non-blocking writes after first response delivery
- faster frontend state updates
- better loading/typing feedback
- appropriate model routing for genuinely simple questions

Do NOT implement all possibilities automatically.

Use evidence.


==================================================
QUALITY MUST NOT REGRESS
==================================================

Do not make the AI faster by materially weakening the assistant.

Preserve all important existing behavior, including where currently implemented:

- company-specific knowledge
- customer context
- booking
- appointment validation
- business opening hours
- closures
- overlap prevention
- rescheduling
- cancellation
- human handoff
- knowledge-gap handling
- negative-feedback handling
- location/address handling
- attachments
- conversation persistence
- security
- tenant isolation

A faster but less reliable assistant is NOT an improvement.


==================================================
TECHNICAL SAFETY
==================================================

All existing ZunftEcho technical rules remain active.

In particular:

- inspect before modifying
- make the smallest correct change
- no destructive database operations
- no unnecessary schema changes
- no unnecessary RLS changes
- preserve multi-tenancy
- preserve tenant isolation
- no service_role exposure in frontend
- no secrets in client code
- no force push
- no unrelated refactoring
- no duplicate architecture
- no replacing stable systems without strong evidence
- no new paid infrastructure without clear justification and required approval
- test changes before considering the task complete

Use GitHub, Supabase, Lovable, browser/testing tools, logs, and other already-authorized tools as needed under the existing Master Operating Directive.


==================================================
BASELINE AND VERIFICATION
==================================================

Before performance changes, establish a reasonable baseline where possible.

After changes, compare against it.

Record useful before/after measurements such as:

- send → backend
- backend/context preparation
- model TTFT
- total model time
- first visible response
- total response completion
- relevant query durations
- error/retry behavior

Do not claim the chat is faster based only on subjective impression.

Verify it.


==================================================
EXECUTION SEQUENCE
==================================================

When this task reaches the appropriate point in the current plan:

1. Inspect the actual current chat implementation.
2. Reproduce the mobile layout problem.
3. Determine the shared/separate relationship between Testchat and customer widget.
4. Design the smallest professional responsive UX improvement.
5. Implement it.
6. Test mobile and desktop behavior.
7. Reconstruct the actual Supabase-based AI request path.
8. Establish latency baseline.
9. Identify the dominant bottlenecks.
10. Implement the highest-impact safe optimizations.
11. Test critical chat/business flows for regression.
12. Compare before/after latency.
13. Verify customer-facing production behavior.
14. Update the existing ZunftEcho source of truth with:
    - what was found
    - what changed
    - measurements
    - remaining limitations
    - relevant decisions
15. Resume the existing business/growth operating plan automatically.

Do NOT finish by asking me what to do next.

After completing and verifying this work, reassess ZunftEcho's current priorities under the Master Operating Directive and continue with the highest-value next action.


==================================================
FINAL CONTINUITY REMINDER
==================================================

This task does NOT override:

- the current execution sequence
- the Master Operating Directive
- autonomous priority ownership
- customer acquisition strategy
- sales work
- marketing work
- Apollo workflows
- website/commercial management
- existing permissions
- existing future plans

Integrate this task intelligently into the current plan.

If there is currently higher-value work in progress, finish it first.

If this issue is currently blocking a demo, prospect, customer, or meaningful conversion opportunity, you may appropriately raise its priority based on your own assessment.

Continue communicating with me in Arabic by default.
