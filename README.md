# Poseidon Admin Panel

Poseidon is a web-based fishpond monitoring and management system that combines live water-quality telemetry, facility administration, workforce assignment, alerts, historical reporting, and IoT water-exchange controls in one dashboard.

The admin panel is the management interface for the wider Poseidon capstone system. It is built with PHP and browser-side JavaScript and uses Firebase for authentication, real-time operational data, and device state.

> This is a capstone/academic project. Validate hardware safeguards, Firebase rules, and operational procedures before using it with production equipment.

## Key Features

- **System overview** — monitored ponds, active workforce, alerts, connected IoT devices, species distribution, and water-quality trends
- **Live monitoring** — pH, dissolved oxygen, and temperature readings with configurable safe ranges
- **Facilities management** — register fishponds, maintain pond information, and manage active facilities
- **Staff accounts and assignments** — manage workers and assign them to fishponds
- **Sensor management** — connect sensor nodes to ponds and configure thresholds
- **Water exchange control** — register pump devices, link them to ponds, and configure manual or automatic operation
- **Alerts and notifications** — create warnings from threshold violations and surface them throughout the interface
- **Activity logs** — review administrative and worker actions
- **Analytics and reports** — filter historical readings and visualize trends and alert distribution
- **Decision support** — generate aeration and water-exchange recommendations from recent pond readings

## Technology Stack

| Area | Technology |
| --- | --- |
| Server-rendered interface | PHP 8+ |
| Frontend | HTML, CSS, JavaScript |
| Styling | Tailwind CSS (CDN) and project CSS |
| Authentication | Firebase Authentication |
| Operational data | Cloud Firestore and Firebase Realtime Database |
| Charts | Chart.js |
| Icons | Lucide |
| Local web server | Apache through XAMPP |
| Hardware integration | ESP32-compatible sensor and pump records |

## Data Model Overview

The interface works with Firebase records such as:

- `users` — administrator and worker profiles, roles, and account status
- `fishponds` — pond details, species, dimensions, assignments, thresholds, and device links
- `fishponds/{pondId}/live/current` — the latest sensor values
- `fishponds/{pondId}/readings` — historical telemetry
- `fishponds/{pondId}/alerts` — threshold and operational alerts
- `devices` — sensor nodes and water-exchange devices assigned to ponds

Exact fields should match the reads and writes in `assets/js/`.

## Getting Started

### Prerequisites

- XAMPP or another Apache/PHP environment
- PHP 8.0 or newer
- A Firebase project with Authentication, Firestore, and Realtime Database enabled
- A modern browser

### Installation with XAMPP

```bash
git clone https://github.com/barabz/poseidon-admin-panel.git
```

Copy or move the inner `poseidon_admin` directory into your XAMPP web root:

```text
C:\xampp\htdocs\poseidon_admin
```

Start **Apache** from the XAMPP Control Panel, then open:

```text
http://localhost/poseidon_admin/
```

### Firebase configuration

Open:

```text
poseidon_admin/views/partials/firebase.php
```

Replace the configuration values with your own Firebase web application settings. Firebase web configuration identifies the project, but access must still be protected with Authentication and restrictive Firestore/Realtime Database security rules.

Enable the authentication providers used by the application, including Email/Password and Google if required. Create corresponding Firestore user documents with the expected `role` and `status` fields.

## Project Structure

```text
poseidon_admin/
├── assets/
│   ├── css/               Page-specific styling
│   └── js/                Firebase data, monitoring, controls, and reports
├── controllers/           PHP controllers for application modules
├── models/                Client-side dashboard model
├── views/
│   ├── partials/          Shared sidebar and Firebase configuration
│   └── ...                Dashboard, monitoring, reports, devices, and accounts
├── index.php              Application entry point and route dispatcher
├── session.php            PHP session guard
├── session_bind.php       Firebase-to-PHP session bridge
└── logout.php             Session logout handler
```

## Main Routes

| Route | Purpose |
| --- | --- |
| `?route=dashboard` | System overview |
| `?route=monitoring` | Live water-quality monitoring |
| `?route=assignments` | Facilities and worker assignments |
| `?route=accounts` | Staff account management |
| `?route=sensors` | Sensor node management |
| `?route=water-exchange` | Pump registration and control |
| `?route=reports` | Operational reports |
| `?route=fishpond-reports` | Historical water-quality analytics |
| `?route=aerator-recommendation` | Aeration decision support |

## Hardware Integration

Poseidon expects IoT hardware to publish sensor values and device status to the configured Firebase records. Before connecting pumps or other actuators:

1. Confirm that device identifiers match the `devices` documents.
2. Validate sensor calibration and safe ranges for the selected fish species.
3. Test manual and automatic modes without a live pump load.
4. Implement physical fail-safes and local overrides independent of the web dashboard.

## Security Notes

- Restrict Firebase rules by authenticated user and role.
- Do not rely on browser-side role checks as the only authorization layer.
- Serve the deployed application over HTTPS.
- Protect the PHP session cookie with secure, HTTP-only, and appropriate SameSite settings.
- Treat device commands as safety-critical and validate them on a trusted backend or device firmware.

## Future Improvements

- Server-side Firebase token verification
- Automated Firestore indexes and seed scripts
- Device command acknowledgements and retry handling
- End-to-end tests for pond registration, monitoring, and water exchange
- Deployment configuration for a managed PHP host

## Author

Developed by [Gabriel Barbacena](https://github.com/barabz) as part of a capstone team.
