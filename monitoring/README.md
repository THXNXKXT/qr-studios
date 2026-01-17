# QR Studios Monitoring Stack

Prometheus + Grafana monitoring for QR Studios API.

## Quick Start

```bash
# Start monitoring stack
docker-compose -f docker-compose.monitoring.yml up -d

# View logs
docker-compose -f docker-compose.monitoring.yml logs -f
```

## Access

| Service | URL | Credentials |
|---------|-----|-------------|
| Grafana | http://localhost:3333 | admin / admin |
| Prometheus | http://localhost:9090 | — |
| Alertmanager | http://localhost:9093 | — |

## Requirements

- Docker & Docker Compose
- Backend running on port 4001

## Pre-configured Alerts

| Alert | Condition |
|-------|-----------|
| APIDown | API unreachable for 1 min |
| HighErrorRate | >5% errors for 5 min |
| HighLatency | p95 >2s for 5 min |
| HighMemoryUsage | >90% heap for 5 min |
| OrderFailures | >10% order failures |
| PaymentFailures | >10% payment failures |

## Dashboard Panels

- Total Requests / Error Rate / Avg Response Time / Uptime
- Request Rate by Endpoint
- Response Time (p95)
- Orders by Status
- Payments by Method
- Cache Hit Rate
- Memory Usage
- API Status

## File Structure

```
monitoring/
├── prometheus.yml          # Prometheus scrape config
├── alerts.yml              # Alert rules
├── alertmanager.yml        # Alert routing
└── grafana/
    ├── provisioning/
    │   ├── datasources/    # Auto-add Prometheus
    │   └── dashboards/     # Auto-load dashboards
    └── dashboards/
        └── qr-studios-api.json  # Pre-built dashboard
```

## Configure Alerts (Optional)

Edit `monitoring/alertmanager.yml` to enable:
- Email notifications
- Slack notifications
- Webhook integrations
