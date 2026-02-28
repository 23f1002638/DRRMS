"""
DRRMS — System Architecture Diagram Generator
Uses the 'diagrams' library with Graphviz backend.
Output: drrms_architecture.png
"""

import os
# Add Graphviz to PATH if not already there (common Windows install location)
graphviz_path = r"C:\Program Files\Graphviz\bin"
if graphviz_path not in os.environ["PATH"]:
    os.environ["PATH"] += os.pathsep + graphviz_path

from diagrams import Diagram, Cluster, Edge
from diagrams.programming.framework import React
from diagrams.programming.language import NodeJS
from diagrams.onprem.database import PostgreSQL   # used as generic DB icon
from diagrams.onprem.client import Users as User
from diagrams.generic.storage import Storage
from diagrams.onprem.network import Nginx as WebServer

graph_attr = {
    "fontsize": "14",
    "bgcolor": "white",
    "pad": "0.8",
    "splines": "ortho",
    "nodesep": "0.6",
    "ranksep": "0.9",
    "fontname": "Helvetica",
}

node_attr = {
    "fontsize": "12",
    "fontname": "Helvetica",
}

with Diagram(
    "DRRMS — Disaster Relief & Resource Management System\nSystem Architecture",
    filename="drrms_architecture",
    outformat="png",
    show=False,
    graph_attr=graph_attr,
    node_attr=node_attr,
    direction="TB",
):

    # ── Client Tier ─────────────────────────────────────────────
    with Cluster("Client Tier", graph_attr={"bgcolor": "#fff3e0", "pencolor": "#e65100", "fontcolor": "#e65100"}):
        admin     = User("Admin")
        volunteer = User("Volunteer")
        victim    = User("Victim")
        donor     = User("Donor")

    # ── Presentation Tier ────────────────────────────────────────
    with Cluster(
        "Presentation Tier — React 18 + TypeScript (Vite, port 5173)",
        graph_attr={"bgcolor": "#e3f2fd", "pencolor": "#1565c0", "fontcolor": "#1565c0"},
    ):
        frontend = React("SPA Entry\n(App.tsx)")

        with Cluster("Role Dashboards", graph_attr={"bgcolor": "#bbdefb"}):
            admin_dash = React("AdminDashboard")
            vol_dash   = React("VolunteerDashboard")
            vic_dash   = React("VictimDashboard")
            don_dash   = React("DonorDashboard")

        with Cluster("Shared Views", graph_attr={"bgcolor": "#bbdefb"}):
            map_view   = WebServer("MapView\n(React-Leaflet)")
            analytics  = React("AnalyticsView\n(Recharts)")
            inventory  = React("InventoryMgmt")
            ai_bot     = React("AI Assistant\n(ai-knowledge.ts)")
            notifs     = React("Notifications")

        with Cluster("Client Libraries", graph_attr={"bgcolor": "#bbdefb"}):
            api_lib    = Storage("api.ts\n(REST Client)")
            geo_lib    = Storage("geolocation.ts\n(Haversine)")

    # ── Application Tier ─────────────────────────────────────────
    with Cluster(
        "Application Tier — Node.js / Express.js (port 3001)",
        graph_attr={"bgcolor": "#e8f5e9", "pencolor": "#1b5e20", "fontcolor": "#1b5e20"},
    ):
        express = NodeJS("Express Server\n(server/index.js)")

        with Cluster("JWT Middleware", graph_attr={"bgcolor": "#c8e6c9"}):
            jwt_mw = NodeJS("authenticateToken\n(Bearer JWT)")

        with Cluster("API Routes", graph_attr={"bgcolor": "#c8e6c9"}):
            r_auth   = NodeJS("/auth\nsignup · login · me")
            r_req    = NodeJS("/requests\nGET · POST · PATCH")
            r_tasks  = NodeJS("/tasks\nclaim · unclaim")
            r_inv    = NodeJS("/inventory\nCRUD")
            r_vol    = NodeJS("/volunteers\nGET")
            r_don    = NodeJS("/donations\nGET · POST")
            r_res    = NodeJS("/resources\nCRUD")
            r_not    = NodeJS("/notifications\nGET · PATCH")
            r_ana    = NodeJS("/analytics\nGET")

    # ── Data Tier ─────────────────────────────────────────────────
    with Cluster(
        "Data Tier — SQLite (database.sqlite)",
        graph_attr={"bgcolor": "#fce4ec", "pencolor": "#880e4f", "fontcolor": "#880e4f"},
    ):
        db = PostgreSQL("SQLite DB\ndatabase.sqlite")

        with Cluster("Core Tables", graph_attr={"bgcolor": "#f8bbd0"}):
            t_users  = Storage("users")
            t_req    = Storage("aid_requests")
            t_tasks  = Storage("volunteer_tasks")
            t_inv    = Storage("inventory")
            t_res    = Storage("resources")
            t_don    = Storage("donations")
            t_notif  = Storage("notifications")

    # ── Connections ───────────────────────────────────────────────

    # Clients → Frontend
    [admin, volunteer, victim, donor] >> Edge(label="HTTPS Browser", color="#e65100", style="bold") >> frontend

    # Frontend routing → Dashboards
    frontend >> Edge(color="#1565c0") >> admin_dash
    frontend >> Edge(color="#1565c0") >> vol_dash
    frontend >> Edge(color="#1565c0") >> vic_dash
    frontend >> Edge(color="#1565c0") >> don_dash

    # Dashboards → Shared Views
    admin_dash >> Edge(color="#1565c0", style="dashed") >> [map_view, analytics, inventory, ai_bot, notifs]
    vol_dash   >> Edge(color="#1565c0", style="dashed") >> [map_view, ai_bot, notifs]
    vic_dash   >> Edge(color="#1565c0", style="dashed") >> [map_view, ai_bot, notifs]
    don_dash   >> Edge(color="#1565c0", style="dashed") >> [analytics, ai_bot, notifs]

    # Frontend → API (via api.ts)
    [analytics, inventory, map_view, notifs] >> Edge(color="#555555") >> api_lib
    api_lib >> Edge(label="HTTP REST + JWT", color="#1b5e20", style="bold") >> express

    # Geolocation library
    geo_lib >> Edge(style="dashed", color="#555555") >> map_view

    # Backend routing
    express >> jwt_mw >> [r_auth, r_req, r_tasks, r_inv, r_vol, r_don, r_res, r_not, r_ana]

    # API Routes → Database
    r_auth  >> Edge(color="#880e4f") >> db
    r_req   >> Edge(color="#880e4f") >> db
    r_tasks >> Edge(color="#880e4f") >> db
    r_inv   >> Edge(color="#880e4f") >> db
    r_vol   >> Edge(color="#880e4f") >> db
    r_don   >> Edge(color="#880e4f") >> db
    r_res   >> Edge(color="#880e4f") >> db
    r_not   >> Edge(color="#880e4f") >> db
    r_ana   >> Edge(color="#880e4f") >> db

    # DB → Tables
    db >> Edge(style="dashed", color="#880e4f") >> [t_users, t_req, t_tasks, t_inv, t_res, t_don, t_notif]


print("Done! Diagram saved as: drrms_architecture.png")
