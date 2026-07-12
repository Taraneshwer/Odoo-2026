The attached 9-screen wireframe is the authoritative INFORMATION ARCHITECTURE reference.

Preserve:  
\- screen coverage  
\- module hierarchy  
\- navigation structure  
\- primary workflows  
\- approximate information density

DO NOT visually reproduce the wireframe.

It is a structural specification, not a visual specification.

Reinterpret the same product architecture using the design system, interaction principles, and quality standards defined below.

If the wireframe conflicts with the written business rules, the written business rules take priority.

If tempted to add a new feature not defined in the specification, do not add it.

You are the Principal Frontend Engineer and Staff Product Designer owning the core UI architecture of TransitOps.

You have spent 15+ years building high-density enterprise software, internal operational tools, financial dashboards, logistics platforms, and mission-critical workflow systems.

You are not building a concept.  
You are not building a Dribbble shot.  
You are not building a generic admin dashboard.  
You are not building an AI-themed SaaS interface.

You are shipping the production frontend of a serious transport operations platform.

Your responsibility includes:

\- frontend architecture  
\- design system  
\- interaction design  
\- information hierarchy  
\- accessibility  
\- responsive behavior  
\- domain-state visualization  
\- frontend API architecture  
\- performance  
\- maintainability  
\- UI consistency

Treat every design decision as if this product will be reviewed by a FAANG Principal Designer, Staff Frontend Engineer, and an enterprise fleet operations manager.

\============================================================  
PRODUCT  
\============================================================

PRODUCT NAME

TransitOps

PRODUCT CATEGORY

Smart Transport Operations Platform

PRODUCT PURPOSE

TransitOps centralizes the operational lifecycle of a transport fleet.

The system manages:

\- vehicle registration  
\- vehicle availability  
\- driver profiles  
\- driver licence compliance  
\- trip creation  
\- dispatch validation  
\- trip lifecycle  
\- vehicle and driver status transitions  
\- vehicle maintenance  
\- fuel logs  
\- operational expenses  
\- fleet utilization  
\- fuel efficiency  
\- operational cost  
\- vehicle ROI  
\- role-based access control

The product replaces spreadsheets, paper logs, and disconnected transport records.

This is operational software.

Users will keep the application open throughout the working day.

The interface must optimize for:

1\. rapid scanning  
2\. low cognitive load  
3\. predictable navigation  
4\. visible system state  
5\. safe operational decisions  
6\. fast repetitive workflows  
7\. clear validation failures  
8\. dense but readable information

\============================================================  
MANDATORY DOMAIN RULES  
\============================================================

The frontend must understand and visually communicate the following domain rules.

VEHICLE STATES

AVAILABLE  
ON\_TRIP  
IN\_SHOP  
RETIRED

DRIVER STATES

AVAILABLE  
ON\_TRIP  
OFF\_DUTY  
SUSPENDED

TRIP STATES

DRAFT  
DISPATCHED  
COMPLETED  
CANCELLED

BUSINESS RULES

1\. Vehicle registration numbers are unique.

2\. IN\_SHOP vehicles cannot be dispatched.

3\. RETIRED vehicles cannot be dispatched.

4\. ON\_TRIP vehicles cannot be assigned to another trip.

5\. Drivers with expired licences cannot be assigned.

6\. SUSPENDED drivers cannot be assigned.

7\. ON\_TRIP drivers cannot be assigned to another trip.

8\. Cargo weight cannot exceed vehicle maximum load capacity.

9\. Dispatching a trip changes:

Vehicle:  
AVAILABLE → ON\_TRIP

Driver:  
AVAILABLE → ON\_TRIP

Trip:  
DRAFT → DISPATCHED

10\. Completing a trip changes:

Vehicle:  
ON\_TRIP → AVAILABLE

Driver:  
ON\_TRIP → AVAILABLE

Trip:  
DISPATCHED → COMPLETED

11\. Cancelling a dispatched trip restores the vehicle and driver to AVAILABLE.

12\. Creating active maintenance changes:

Vehicle:  
AVAILABLE → IN\_SHOP

13\. Closing maintenance changes:

Vehicle:  
IN\_SHOP → AVAILABLE

unless the vehicle is RETIRED.

These rules are fundamental to the UI.

Do not hide them.

The interface must visibly communicate:

\- why an action is available  
\- why an action is unavailable  
\- what will change after an action  
\- which entities are affected

\============================================================  
TECHNOLOGY CONSTRAINT  
\============================================================

Use:

\- SolidJS  
\- TypeScript  
\- Vite  
\- Tailwind CSS  
\- @solidjs/router  
\- Lucide icons  
\- Apache ECharts

Do not use React.

Do not use Next.js.

Do not introduce another frontend framework.

Use SolidJS idiomatically.

Use:

createSignal  
createMemo  
createResource  
createStore

where appropriate.

Avoid forcing React patterns into SolidJS.

Use strict TypeScript.

Do not use \`any\` as a shortcut.

\============================================================  
CORE DESIGN DIRECTIVE  
\============================================================

BUILD A QUIET INTERFACE.

The product should visually disappear behind the operational information.

The UI must feel:

precise  
restrained  
calm  
intentional  
fast  
mature  
structured

Use product-quality principles associated with mature software such as:

Linear  
Stripe Dashboard  
Vercel  
Ramp  
GitHub  
modern internal operations tooling

DO NOT COPY THEIR VISUAL DESIGN.

Study the principles:

\- disciplined spacing  
\- restrained color  
\- excellent typography  
\- strong hierarchy  
\- high information density  
\- predictable interactions  
\- subtle feedback  
\- minimal decoration

TransitOps must develop its own visual identity.

\============================================================  
ABSOLUTE ANTI-PATTERNS  
\============================================================

DO NOT generate a generic AI dashboard.

DO NOT use:

\- glassmorphism  
\- backdrop blur as decoration  
\- glowing borders  
\- neon colors  
\- animated gradients  
\- gradient text  
\- giant KPI cards  
\- giant typography  
\- excessive card grids  
\- rounded rectangles around every element  
\- excessive shadows  
\- decorative charts  
\- fake AI insights  
\- chatbot widgets  
\- floating action buttons  
\- random illustrations  
\- 3D graphics  
\- emojis  
\- excessive badges  
\- excessive icons  
\- excessive tooltips  
\- pill-shaped everything  
\- rainbow status colors  
\- marketing copy inside the application  
\- oversized empty spaces  
\- landing-page layouts  
\- meaningless animations  
\- fake live indicators  
\- arbitrary percentage changes  
\- random "12% better this month" statistics

Do not add information merely to make the interface appear populated.

Every visible value must have a domain purpose.

If an element does not help the user:

UNDERSTAND  
NAVIGATE  
DECIDE  
VALIDATE  
OR ACT

remove it.

\============================================================  
DESIGN SYSTEM  
\============================================================

Create a small internal design system.

Do not scatter arbitrary Tailwind values throughout the application.

Define semantic design tokens.

COLORS

The primary experience is dark.

Do not use pure black.

Suggested conceptual hierarchy:

canvas  
surface  
surface-raised  
surface-hover

border-subtle  
border-default  
border-strong

text-primary  
text-secondary  
text-tertiary  
text-disabled

accent-primary

status-success  
status-warning  
status-danger  
status-info  
status-neutral

PRIMARY ACCENT

Use a restrained warm amber.

Amber is for:

\- primary actions  
\- selected navigation  
\- active tabs  
\- focus emphasis  
\- intentional selection

Amber is NOT a decorative background color.

SEMANTIC COLOR RULES

Green:  
Available  
Completed  
Successful

Blue:  
On Trip  
Active informational state

Amber:  
Pending  
Warning  
In Shop

Red:  
Blocked  
Expired  
Suspended  
Critical

Gray:  
Retired  
Off Duty  
Inactive

Never communicate state using color alone.

Always pair color with:

text  
icon  
or another visual indicator

\============================================================  
TYPOGRAPHY  
\============================================================

Use Geist or Inter.

Typography must carry most of the hierarchy.

Use approximately:

Page title:  
22px / 600

Section title:  
14–16px / 600

Body:  
13–14px / 400

Table:  
13px

Metadata:  
12px

Labels:  
12–13px / 500

Metrics:  
24–30px maximum

Do not use 48px dashboard numbers.

Use tabular numerals for:

currency  
percentages  
odometer values  
distances  
fuel quantities  
capacities  
scores

Use uppercase extremely sparingly.

Do not uppercase every table heading aggressively.

Avoid excessive bold text.

\============================================================  
SPACING  
\============================================================

Use an 8px-based spacing system.

Preferred values:

4  
8  
12  
16  
24  
32  
48

Do not randomly use arbitrary gaps.

The interface must align cleanly.

Repeated structures must use identical spacing.

Tables, forms, drawers, and page headers must follow shared spacing rules.

\============================================================  
SHAPE LANGUAGE  
\============================================================

Use restrained corner radii.

Inputs:  
6px–8px

Buttons:  
6px–8px

Panels:  
8px–10px

Drawers:  
minimal radius where appropriate

Do not create 20px rounded cards.

Do not make every text label a pill.

Use borders more often than shadows.

Use shadows only for:

modal  
drawer  
temporary overlay

\============================================================  
APPLICATION SHELL  
\============================================================

Build a persistent AppShell.

STRUCTURE

┌──────────────────────────────────────────────────────┐  
│ Sidebar │ Top Bar                                    │  
│         ├────────────────────────────────────────────│  
│         │ Main Content                               │  
│         │                                            │  
│         │                                            │  
└──────────────────────────────────────────────────────┘

\============================================================  
SIDEBAR  
\============================================================

Desktop width:  
approximately 216–224px.

The sidebar should feel structurally integrated into the product.

TOP

TransitOps wordmark.

No giant logo.

NAVIGATION

Overview  
Vehicles  
Drivers  
Trips  
Maintenance  
Fuel & Expenses  
Reports

BOTTOM

Settings

Use Lucide outline icons.

Icon size:  
16–18px.

Navigation row height:  
approximately 36–40px.

Selected state:

subtle amber-tinted surface  
amber icon  
primary text

Do not use a thick glowing border.

Hover state:

subtle surface change.

Collapsed state:

approximately 64px.

Show icons only.

Use tooltips in collapsed mode.

\============================================================  
TOP BAR  
\============================================================

Height:  
approximately 56px.

Contents:

left:  
sidebar toggle

center/available area:  
global search

right:  
notifications  
current role  
avatar  
account menu

Global search placeholder:

Search vehicles, drivers, trips...

Use a restrained search field.

Do not create a huge command bar.

The top bar should not compete with page content.

\============================================================  
PAGE FRAME  
\============================================================

Every page follows the same structure.

PAGE HEADER

Left:

Page title  
Optional one-line description

Right:

Primary action  
Optional secondary action

Then:

filters or tabs

Then:

content

Example:

Vehicles

Manage fleet assets and operational availability.

\[Search\] \[Type\] \[Status\]                    \[Add vehicle\]

\------------------------------------------------------------

TABLE

Maintain identical header alignment across all pages.

\============================================================  
AUTHENTICATION  
\============================================================

ROUTE

/login

Create a minimal split layout.

Do not build a marketing landing page.

LEFT SIDE

Approximately 42% width.

TransitOps wordmark.

Primary statement:

Drive operations.  
Deliver with confidence.

Highlight only the word "confidence" using restrained amber.

Supporting copy:

Centralized fleet operations for vehicle management, dispatch, maintenance, and reporting.

Capabilities:

Fleet management  
Trip dispatch  
Maintenance control  
Operational reporting

Use simple Lucide icons or check indicators.

No illustration.

No stock photography.

No decorative globe.

No abstract gradient blobs.

RIGHT SIDE

Approximately 58% width.

Center a login form with maximum width around 380px.

Heading:

Sign in to your account

Supporting text:

Enter your credentials to continue.

FIELDS

Email address  
Password

CONTROLS

Remember me  
Forgot password?

PRIMARY ACTION

Sign in

Below the form, provide demo account information only if mock mode is enabled.

FORM STATES

default  
focused  
invalid email  
incorrect credentials  
loading  
disabled

On submit loading:

keep button width stable.

Show a subtle spinner.

Text:

Signing in...

\============================================================  
OVERVIEW  
\============================================================

ROUTE

/

PAGE TITLE

Overview

DESCRIPTION

Monitor fleet availability and active transport operations.

KPI STRIP

Create five compact metrics.

Total Vehicles  
Available Vehicles  
Active Trips  
In Maintenance  
Fleet Utilization

These should NOT look like five giant independent cards.

Prefer a connected metric strip or restrained panels sharing visual rhythm.

Each metric contains:

label  
value  
optional context

Example:

Available Vehicles

26

of 42 fleet vehicles

Do not invent growth percentages.

MAIN GRID

Use approximately:

65% / 35%

LEFT

Active Trips

Dense table.

Columns:

Trip  
Route  
Vehicle  
Driver  
Status  
ETA

Route format:

Chennai  
→ Bengaluru

Do not create route cards.

RIGHT

Fleet Status

Use either:

minimal donut

OR

horizontal status bars

Choose whichever produces better visual clarity.

Statuses:

Available  
On Trip  
In Shop  
Retired

SECONDARY ROW

LEFT

Trip Summary

Total  
Completed  
Pending  
Cancelled

Use compact inline statistics.

RIGHT

Recent Operational Activity

Example rows:

Van-08 entered maintenance

Driver Raj Anand's licence expires in 5 days

Trip TR-1042 completed

Each activity row contains:

semantic icon  
description  
timestamp

Do not create separate cards for every activity.

\============================================================  
VEHICLES  
\============================================================

ROUTE

/vehicles

TITLE

Vehicles

DESCRIPTION

Manage fleet assets and operational availability.

TOOLBAR

Search vehicles

Vehicle type filter

Status filter

Add vehicle

The Add Vehicle button is the only primary amber action.

TABLE

Columns:

Registration  
Vehicle  
Type  
Capacity  
Odometer  
Acquisition Cost  
Status  
Actions

Use:

sticky table header where appropriate

subtle row separators

48–52px row height

row hover state

aligned numeric columns

tabular numerals

STATUS COMPONENT

Create one shared StatusBadge component.

Available  
green

On Trip  
blue

In Shop  
amber

Retired  
gray

Badge styling must be restrained.

ROW ACTIONS

Use a compact more-actions menu.

Do not display five action icons permanently.

ROW CLICK

Open VehicleDrawer.

\============================================================  
VEHICLE DRAWER  
\============================================================

Width:

approximately 420–480px desktop.

HEADER

Van-05

TN01AB1234

Available

DETAIL GROUP

Vehicle type  
Maximum capacity  
Current odometer  
Acquisition cost

Use description-list layout.

Do not use individual cards.

ACTIVITY

Recent Activity

Use a vertical activity list.

Example:

Trip TR-1042 completed  
12 Jul 2026 · 14:32

Fuel log recorded  
12 Jul 2026 · 09:14

Maintenance closed  
10 Jul 2026 · 17:05

Drawer must support:

loading  
error  
empty activity

\============================================================  
ADD VEHICLE  
\============================================================

Use a drawer or focused modal.

Fields:

Registration Number  
Vehicle Name / Model  
Vehicle Type  
Maximum Load Capacity  
Current Odometer  
Acquisition Cost

Use a two-column layout only where fields naturally pair.

Registration Number:  
full width

Vehicle and Type:  
paired

Capacity and Odometer:  
paired

Acquisition Cost:  
full width or logically aligned

FOOTER

Cancel

Add vehicle

Keep actions visible.

Validate registration uniqueness.

Show the error directly under the registration input.

Example:

A vehicle with registration TN01AB1234 already exists.

\============================================================  
DRIVERS  
\============================================================

ROUTE

/drivers

TITLE

Drivers

DESCRIPTION

Manage driver availability and licence compliance.

TOOLBAR

Search drivers  
Status  
Add driver

TABLE

Driver  
Licence Number  
Category  
Expiry Date  
Safety Score  
Status  
Actions

DRIVER CELL

Show:

Alex Kumar

Optional secondary contact metadata.

Do not use giant avatars.

Use 28–32px avatar if required.

LICENCE EXPIRY

Normal:

12 Dec 2027

Near expiry:

12 days remaining

Use warning styling.

Expired:

Expired 02 Jun 2026

Use restrained red text and icon.

Do not make the entire row red.

SAFETY SCORE

Show:

87

Optional quiet:

/100

Do not use circular gauges.

Do not use progress rings.

STATUS

Available  
On Trip  
Off Duty  
Suspended

Click row:

open DriverDrawer.

\============================================================  
TRIP DISPATCHER  
\============================================================

ROUTE

/trips/new

THIS IS THE PRODUCT'S PRIMARY OPERATIONAL WORKFLOW.

Give this screen the highest interaction quality.

Do not treat it like a generic multi-step form.

PAGE TITLE

Create Trip

DESCRIPTION

Configure and validate a transport dispatch.

STEPPER

Route  
Vehicle  
Driver  
Cargo  
Review

Use:

thin horizontal line

small 20–24px step indicators

short labels

COMPLETED STEP

check icon

CURRENT STEP

amber indicator

FUTURE STEP

neutral

Do not use giant numbered circles.

LAYOUT

Desktop:

main workflow area:  
approximately 65%

persistent summary:  
approximately 35%

The right-side Trip Summary remains visible as the user progresses.

\============================================================  
TRIP SUMMARY PANEL  
\============================================================

Display only selected information.

ROUTE

Chennai  
↓  
Bengaluru

Distance

350 km

VEHICLE

Van-05  
TN01AB1234

DRIVER

Alex Kumar

CARGO

450 / 500 kg

Do not show placeholder dashes excessively.

If something has not been selected:

use quiet text such as:

Not selected

\============================================================  
ROUTE STEP  
\============================================================

Fields:

Source  
Destination  
Planned Distance

Use clear labels.

Prevent identical source and destination.

Distance must be greater than zero.

Continue button:

Continue to vehicle

\============================================================  
VEHICLE STEP  
\============================================================

Search field.

Show only dispatch-eligible vehicles.

Vehicle selection rows.

Each row contains:

vehicle name  
registration  
type  
capacity  
odometer  
status

Example:

Van-05  
TN01AB1234

Van · 500 kg capacity

84,230 km

Available

Selected state:

1px amber-emphasis border

very subtle amber surface tint

check icon aligned right

Do not create large cards.

Use compact rows.

Provide a quiet explanation:

Only available vehicles are shown.

\============================================================  
DRIVER STEP  
\============================================================

Show only eligible drivers.

Each row:

Name  
Licence Category  
Licence Expiry  
Safety Score

Example:

Alex Kumar

LMV

Licence valid until 12 Dec 2027

Safety 87/100

Drivers who are:

Suspended  
On Trip  
Expired

must not be selectable.

If business requirements require visibility, show them under:

Unavailable drivers

with the reason.

Example:

Raj Anand

Unavailable

Licence expired 02 Jun 2026

This is preferable to silently hiding every invalid option because it explains operational state.

\============================================================  
CARGO STEP  
\============================================================

Cargo Weight

Numeric input.

Show selected vehicle capacity.

Example:

Vehicle capacity

500 kg

INPUT

450 kg

CAPACITY VISUALIZATION

Use a 4–6px horizontal bar.

450 kg of 500 kg

90% utilized

VALID

check icon

Cargo is within vehicle capacity.

INVALID

alert icon

Capacity exceeded by 100 kg.

The error must update immediately.

Continue button must be disabled when invalid.

Do not rely on toast feedback.

\============================================================  
REVIEW STEP  
\============================================================

Create a clean two-section layout.

TRIP DETAILS

Route  
Distance  
Vehicle  
Driver  
Cargo

VALIDATION

Vehicle available

Driver available

Driver licence valid

Cargo within capacity

Each validation row contains:

status icon  
rule label  
optional contextual value

SUCCESS

All dispatch checks passed.

Ready to dispatch.

PRIMARY ACTION

Dispatch trip

FAILURE

Dispatch blocked

2 issues require attention.

List every failed rule.

Each failure should provide an action when possible.

Example:

Cargo exceeds capacity by 100 kg.

Edit cargo

Driver licence expired.

Select another driver

Do not hide domain validation inside a modal.

\============================================================  
DISPATCH SUCCESS  
\============================================================

After successful dispatch:

Do not show confetti.

Do not show a giant celebration screen.

Show concise confirmation.

Trip TR-1042 dispatched

Chennai → Bengaluru

Then visually communicate state transitions:

Van-05

Available → On Trip

Alex Kumar

Available → On Trip

Actions:

View trip

Return to overview

\============================================================  
MAINTENANCE  
\============================================================

ROUTE

/maintenance

TITLE

Maintenance

DESCRIPTION

Track vehicle maintenance and operational availability.

TABS

Active Maintenance  
Maintenance History

TABLE

Vehicle  
Maintenance Type  
Description  
Cost  
Start Date  
Status  
Actions

PRIMARY ACTION

New maintenance

\============================================================  
CREATE MAINTENANCE  
\============================================================

Use a drawer.

Fields:

Vehicle  
Maintenance Type  
Description  
Cost  
Start Date

After selecting a vehicle, show:

OPERATIONAL EFFECT

Vehicle status

Available → In Shop

Van-05 will be removed from dispatch availability.

This section must visually stand apart through hierarchy, not excessive color.

Use:

small warning icon

subtle amber border or surface

On submission success:

Maintenance created

Van-05

Available → In Shop

\============================================================  
CLOSE MAINTENANCE  
\============================================================

Use a confirmation dialog.

Title:

Close maintenance?

Explain:

Van-05 will return to available fleet inventory.

STATE CHANGE

In Shop → Available

Actions:

Cancel

Close maintenance

\============================================================  
FUEL AND EXPENSES  
\============================================================

ROUTE

/expenses

TITLE

Fuel & Expenses

DESCRIPTION

Track fleet fuel consumption and operational spending.

TABS

Fuel Logs  
Other Expenses

\============================================================  
FUEL LOGS  
\============================================================

TOOLBAR

Search  
Vehicle filter  
Add fuel log

TABLE

Date  
Vehicle  
Fuel  
Cost  
Odometer  
Efficiency  
Actions

Values:

40.00 L

₹4,200

84,230 km

10.21 km/L

Align numeric values consistently.

Below the table:

FUEL EFFICIENCY

Provide a vehicle selector.

Display:

Van-05

10.21 km/L

Then one restrained trend line.

No gradient fill.

No glowing line.

Minimal grid.

Useful tooltip.

\============================================================  
OTHER EXPENSES  
\============================================================

TABLE

Date  
Vehicle  
Category  
Description  
Amount  
Actions

Categories:

Toll  
Maintenance  
Other

At the bottom or above the table show:

Total Operational Cost

₹2,48,000

Do not create a huge metric card.

\============================================================  
REPORTS  
\============================================================

ROUTE

/reports

TITLE

Reports

DESCRIPTION

Analyse fleet efficiency and operational cost.

FILTER BAR

Date Range  
Vehicle Type

Export

Export is secondary unless actively generating a report.

METRICS

Total Trips

Fleet Utilization

Operational Cost

Average Fuel Efficiency

Use the same metric component as Overview.

Do not create a second visual language.

ANALYTICS GRID

Fleet Utilization Over Time

Cost Distribution

Vehicle ROI

FLEET UTILIZATION

Minimal line chart.

COST DISTRIBUTION

Fuel  
Maintenance  
Other

Restrained donut.

VEHICLE ROI

Horizontal bar chart.

Use vehicle names on the Y axis.

Use percentage values.

Do not use gradients.

Do not animate charts excessively.

Do not show meaningless trend predictions.

\============================================================  
SETTINGS  
\============================================================

ROUTE

/settings

TITLE

Settings

TABS

General  
Roles & Permissions  
Users

\============================================================  
ROLES AND PERMISSIONS  
\============================================================

Use a permission matrix.

ROLES

Fleet Manager  
Dispatch User  
Safety Officer  
Financial Analyst

MODULES

Dashboard  
Vehicles  
Drivers  
Trips  
Maintenance  
Fuel & Expenses  
Reports  
Settings

Use check icons for allowed.

Use minus or restricted indicators for unavailable.

Do not use large toggle switches inside every matrix cell.

Save Changes should only become enabled when permissions are modified.

If there are unsaved changes:

show a quiet sticky save bar.

Unsaved permission changes

Discard

Save changes

\============================================================  
SHARED COMPONENTS  
\============================================================

Build reusable primitives.

Button

Variants:

primary  
secondary  
ghost  
danger

Sizes:

sm  
md

Input

Select

Textarea

Checkbox

Badge

StatusBadge

Tabs

DataTable

Drawer

Modal

ConfirmDialog

Toast

Skeleton

EmptyState

ErrorState

Metric

PageHeader

FilterBar

DescriptionList

ActivityList

StateTransition

ValidationList

Do not duplicate implementations between pages.

\============================================================  
STATE TRANSITION COMPONENT  
\============================================================

Create a reusable StateTransition component.

Example:

AVAILABLE → ON TRIP

Use it for:

dispatch  
trip completion  
trip cancellation  
maintenance creation  
maintenance closure

Props should conceptually support:

from  
to  
entity  
semantic intent

The component must remain visually restrained.

This is a core visual pattern of TransitOps.

\============================================================  
VALIDATION LIST COMPONENT  
\============================================================

Create a reusable ValidationList.

Example:

✓ Vehicle available

✓ Driver available

✓ Licence valid

✕ Cargo within capacity

Validation states:

pass  
fail  
pending

Failed validation may include:

message  
action label  
action callback

This component is central to the Trip Dispatcher.

\============================================================  
FRONTEND DOMAIN TYPES  
\============================================================

Create strict domain types.

VehicleStatus \=  
'AVAILABLE'  
| 'ON\_TRIP'  
| 'IN\_SHOP'  
| 'RETIRED'

DriverStatus \=  
'AVAILABLE'  
| 'ON\_TRIP'  
| 'OFF\_DUTY'  
| 'SUSPENDED'

TripStatus \=  
'DRAFT'  
| 'DISPATCHED'  
| 'COMPLETED'  
| 'CANCELLED'

Vehicle

id  
registrationNumber  
name  
type  
maxLoadCapacity  
odometer  
acquisitionCost  
status

Driver

id  
name  
licenseNumber  
licenseCategory  
licenseExpiryDate  
contactNumber  
safetyScore  
status

Trip

id  
source  
destination  
vehicleId  
driverId  
cargoWeight  
plannedDistance  
status  
createdAt  
dispatchedAt  
completedAt

MaintenanceRecord

id  
vehicleId  
type  
description  
cost  
startDate  
closedDate  
status

FuelLog

id  
vehicleId  
liters  
cost  
date  
odometer  
efficiency

Expense

id  
vehicleId  
category  
description  
amount  
date

Role

id  
name  
permissions

\============================================================  
SERVICE ARCHITECTURE  
\============================================================

Pages must NEVER contain embedded mock arrays.

BAD:

const vehicles \= \[  
  ...  
\]

inside Vehicles.tsx.

DO NOT DO THIS.

Create service interfaces.

vehicleService

getVehicles  
getVehicle  
createVehicle  
updateVehicle

driverService

getDrivers  
getDriver  
createDriver

tripService

getTrips  
createTrip  
validateTrip  
dispatchTrip  
completeTrip  
cancelTrip

maintenanceService

getMaintenanceRecords  
createMaintenance  
closeMaintenance

expenseService

getFuelLogs  
createFuelLog  
getExpenses  
createExpense

reportService

getOverviewMetrics  
getFleetUtilization  
getCostDistribution  
getVehicleROI

Use:

VITE\_API\_BASE\_URL

Create a centralized HTTP client.

Prepare the frontend for FastAPI.

The page should not care whether data comes from:

mock service

or

FastAPI.

\============================================================  
MOCK DATA  
\============================================================

Create realistic Indian fleet operations data.

Use examples such as:

Vehicles:

Van-05  
Truck-12  
Van-08  
Mini Truck-02  
Truck-09

Registration examples:

TN01AB1234  
TN09CD8821  
TN07EF4421

Drivers:

Alex Kumar  
Ravi Shankar  
Suresh Babu  
Imran Khan  
Mahesh Yadav  
Raj Anand

Routes:

Chennai → Bengaluru  
Chennai → Hyderabad  
Kochi → Bengaluru  
Mumbai → Pune  
Delhi → Jaipur

Use realistic:

odometer values  
fuel quantities  
vehicle capacities  
costs

Do not use lorem ipsum.

Do not use:

John Doe  
Jane Smith  
Acme Corp  
Vehicle 1  
Driver 1

\============================================================  
LOADING STATES  
\============================================================

Use skeletons that match final content geometry.

Table loading:

render 6–8 skeleton rows.

Metric loading:

preserve metric dimensions.

Drawer loading:

show description-list skeletons.

Do not use full-page spinners.

\============================================================  
EMPTY STATES  
\============================================================

Empty states must be contextual.

Vehicles:

No vehicles found

Adjust your filters or register a vehicle.

Trips:

No active trips

Dispatched trips will appear here.

Maintenance:

No active maintenance

All fleet vehicles are currently outside maintenance.

Do not use generic:

No data available.

\============================================================  
ERROR STATES  
\============================================================

Errors must identify what failed.

Example:

Unable to load vehicles.

The vehicle registry could not be retrieved.

Retry

Do not expose raw API errors.

Do not show stack traces.

\============================================================  
ACCESSIBILITY  
\============================================================

Target WCAG AA.

All interactive controls must support keyboard navigation.

Provide visible focus states.

Use semantic HTML.

Buttons must be buttons.

Links must be links.

Tables must use proper table markup.

Drawers and modals must:

trap focus  
close with Escape  
restore focus

Icon-only buttons require accessible labels.

Never rely on color alone for status.

\============================================================  
RESPONSIVENESS  
\============================================================

PRIMARY TARGET

Desktop enterprise workflow.

Breakpoints should support:

large desktop  
desktop  
tablet  
mobile

DESKTOP

Persistent sidebar.

Full tables.

Two-column dispatcher.

TABLET

Collapsed icon sidebar.

Reduced columns where appropriate.

MOBILE

Navigation drawer.

Single-column layout.

Trip Summary moves below or above the active workflow step.

Tables may horizontally scroll.

Do not transform complex operational tables into visually bloated cards unless necessary.

Maintain information density.

\============================================================  
PERFORMANCE  
\============================================================

Avoid unnecessary reactive updates.

Use createMemo for derived values.

Lazy-load major routes where practical.

Avoid loading ECharts on pages that do not use charts.

Do not introduce large dependencies for trivial UI functionality.

Keep component boundaries meaningful.

\============================================================  
FILE ARCHITECTURE  
\============================================================

src/  
├── app/  
│   ├── router.tsx  
│   └── providers.tsx  
│  
├── components/  
│   ├── ui/  
│   │   ├── Button.tsx  
│   │   ├── Input.tsx  
│   │   ├── Select.tsx  
│   │   ├── Textarea.tsx  
│   │   ├── Checkbox.tsx  
│   │   ├── Badge.tsx  
│   │   ├── StatusBadge.tsx  
│   │   ├── Tabs.tsx  
│   │   ├── DataTable.tsx  
│   │   ├── Drawer.tsx  
│   │   ├── Modal.tsx  
│   │   ├── ConfirmDialog.tsx  
│   │   ├── Skeleton.tsx  
│   │   └── Toast.tsx  
│   │  
│   ├── layout/  
│   │   ├── AppShell.tsx  
│   │   ├── Sidebar.tsx  
│   │   ├── TopBar.tsx  
│   │   └── PageHeader.tsx  
│   │  
│   └── domain/  
│       ├── Metric.tsx  
│       ├── StateTransition.tsx  
│       ├── ValidationList.tsx  
│       ├── ActivityList.tsx  
│       └── DescriptionList.tsx  
│  
├── features/  
│   ├── auth/  
│   ├── overview/  
│   ├── vehicles/  
│   ├── drivers/  
│   ├── trips/  
│   ├── maintenance/  
│   ├── expenses/  
│   ├── reports/  
│   └── settings/  
│  
├── services/  
│   ├── http.ts  
│   ├── vehicles.ts  
│   ├── drivers.ts  
│   ├── trips.ts  
│   ├── maintenance.ts  
│   ├── expenses.ts  
│   └── reports.ts  
│  
├── stores/  
│   ├── auth.ts  
│   └── ui.ts  
│  
├── types/  
│   ├── vehicle.ts  
│   ├── driver.ts  
│   ├── trip.ts  
│   ├── maintenance.ts  
│   ├── expense.ts  
│   └── auth.ts  
│  
├── lib/  
│   ├── format.ts  
│   ├── validation.ts  
│   └── constants.ts  
│  
├── styles/  
│   └── globals.css  
│  
├── App.tsx  
└── index.tsx

\============================================================  
IMPLEMENTATION ORDER  
\============================================================

Do not randomly generate pages.

Build in this order:

PHASE 1

Design tokens  
Global styles  
Typography  
AppShell  
Sidebar  
TopBar

PHASE 2

Shared UI primitives

Button  
Input  
Select  
StatusBadge  
Tabs  
Drawer  
Modal  
DataTable  
Skeleton

PHASE 3

Domain components

Metric  
StateTransition  
ValidationList  
DescriptionList  
ActivityList

PHASE 4

Authentication

PHASE 5

Overview

PHASE 6

Vehicle Registry

PHASE 7

Drivers

PHASE 8

Trip Dispatcher

Spend the most refinement time here.

PHASE 9

Maintenance

PHASE 10

Fuel & Expenses

PHASE 11

Reports

PHASE 12

Settings and RBAC

PHASE 13

Responsive refinement

PHASE 14

Accessibility review

PHASE 15

Visual consistency review

\============================================================  
FINAL VISUAL REVIEW  
\============================================================

Before considering the frontend complete, review every page.

REMOVE:

unnecessary cards  
unnecessary borders  
unnecessary badges  
unnecessary icons  
unnecessary text  
unnecessary color  
unnecessary empty space

CHECK:

Are page headers consistent?

Are table row heights consistent?

Are status colors consistent?

Are buttons consistent?

Are primary actions obvious?

Are disabled actions explained?

Are state transitions visible?

Are validation failures actionable?

Can a fleet manager scan a page in under five seconds?

Does the Trip Dispatcher clearly explain why dispatch is allowed or blocked?

Does the product feel calm with large amounts of data?

\============================================================  
FINAL ACCEPTANCE CRITERIA  
\============================================================

The frontend is complete only when:

1\. All nine product areas are implemented.

2\. Navigation is functional.

3\. The application uses SolidJS correctly.

4\. TypeScript domain types are strict.

5\. Mock data is separated from page components.

6\. Services are ready to connect to FastAPI.

7\. Vehicle status is consistently represented.

8\. Driver status is consistently represented.

9\. Trip lifecycle states are consistently represented.

10\. Dispatch validation is visible and actionable.

11\. Cargo capacity validation works interactively.

12\. Invalid drivers cannot be selected.

13\. Invalid vehicles cannot be selected.

14\. Maintenance clearly communicates AVAILABLE → IN SHOP.

15\. Closing maintenance communicates IN SHOP → AVAILABLE.

16\. Dashboard metrics use realistic data.

17\. Charts are restrained and operationally relevant.

18\. Every page has loading, empty, and error states.

19\. The application is keyboard accessible.

20\. The interface does not look like an AI-generated dashboard.

21\. The interface does not look like a hackathon prototype.

22\. The interface looks credible for a real logistics organization managing hundreds of vehicles.

\============================================================  
FINAL DIRECTIVE  
\============================================================

Do not optimize for visual spectacle.

Optimize for operational clarity.

Do not decorate weak hierarchy.

Fix the hierarchy.

Do not create more cards when spacing can solve the problem.

Do not hide business logic.

Visualize it.

Do not make users guess why an action is disabled.

Explain it.

Do not make the interface look futuristic.

Make it look inevitable.

The best version of TransitOps should feel as though every pixel, interaction, state, and component was deliberately reviewed by a mature enterprise product engineering organization.

Build the complete frontend accordingly.  
