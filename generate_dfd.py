"""
DRRMS — Data Flow Diagram: Aid Request Lifecycle
Output: drrms_dfd_aid_request.png
"""

import os
graphviz_path = r"C:\Program Files\Graphviz\bin"
if graphviz_path not in os.environ["PATH"]:
    os.environ["PATH"] += os.pathsep + graphviz_path

from diagrams import Diagram, Cluster, Edge
from diagrams.onprem.client import Users
from diagrams.programming.framework import React
from diagrams.programming.language import NodeJS
from diagrams.onprem.database import PostgreSQL
from diagrams.generic.storage import Storage

graph_attr = {
    "fontsize": "13",
    "bgcolor": "white",
    "pad": "1.0",
    "splines": "ortho",
    "nodesep": "0.7",
    "ranksep": "1.0",
    "fontname": "Helvetica",
    "label": "DRRMS — Data Flow Diagram: Aid Request Lifecycle",
    "labelloc": "t",
    "labelfontsize": "16",
}

with Diagram(
    "",
    filename="drrms_dfd_aid_request",
    outformat="png",
    show=False,
    graph_attr=graph_attr,
    direction="TB",
):

    # ── External Entities ──────────────────────────────────────────
    victim    = Users("Victim\n(External Entity)")
    volunteer = Users("Volunteer\n(External Entity)")
    admin     = Users("Admin\n(External Entity)")

    # ── Process 1: Submit Aid Request ─────────────────────────────
    with Cluster("P1: Submit Aid Request\n(AidRequestForm.tsx)", graph_attr={"bgcolor": "#fff9c4", "pencolor": "#f9a825"}):
        p1_form    = React("Capture: type, urgency,\npeople count, GPS coords,\ndescription")
        p1_gps     = React("HTML5 Geolocation API\n(auto-fill lat/lng)")

    # ── Process 2: API — Create Request ───────────────────────────
    with Cluster("P2: Create Request\n(POST /api/requests)", graph_attr={"bgcolor": "#e8f5e9", "pencolor": "#2e7d32"}):
        p2_auth    = NodeJS("Validate JWT\n(authenticateToken)")
        p2_insert  = NodeJS("INSERT aid_requests\nstatus = 'pending'")

    # ── Data Store 1 ──────────────────────────────────────────────
    with Cluster("D1: aid_requests table", graph_attr={"bgcolor": "#fce4ec", "pencolor": "#880e4f"}):
        ds_req = PostgreSQL("aid_requests\n{ id, type, urgency, status,\nuser_id, lat, lng }")

    # ── Process 3: Poll — Volunteer Feed ──────────────────────────
    with Cluster("P3: Fetch Open Tasks\n(GET /api/requests — poll every 5s)", graph_attr={"bgcolor": "#e3f2fd", "pencolor": "#1565c0"}):
        p3_poll    = NodeJS("Filter: status='pending'\nSort by urgency DESC")
        p3_feed    = React("AvailableTasksView\n(Volunteer Dashboard)")

    # ── Process 4: Claim Task ─────────────────────────────────────
    with Cluster("P4: Claim Task\n(POST /api/tasks/claim)", graph_attr={"bgcolor": "#e8f5e9", "pencolor": "#2e7d32"}):
        p4_lock    = NodeJS("Atomic check: status='pending'\nUPDATE → 'in_progress'")
        p4_join    = NodeJS("INSERT volunteer_tasks\n{ volunteer_id, request_id,\nstatus='claimed' }")

    # ── Data Store 2 ──────────────────────────────────────────────
    with Cluster("D2: volunteer_tasks table", graph_attr={"bgcolor": "#fce4ec", "pencolor": "#880e4f"}):
        ds_task = Storage("volunteer_tasks\n{ volunteer_id, request_id,\nstatus, claimed_at }")

    # ── Process 5: Complete Task ───────────────────────────────────
    with Cluster("P5: Complete Task\n(PATCH /api/tasks/:id)", graph_attr={"bgcolor": "#e8f5e9", "pencolor": "#2e7d32"}):
        p5_complete = NodeJS("UPDATE aid_requests\nstatus = 'resolved'\nSET completed_at = NOW()")
        p5_notif    = NodeJS("INSERT notifications\nfor Victim & Admin")

    # ── Data Store 3 ──────────────────────────────────────────────
    with Cluster("D3: notifications table", graph_attr={"bgcolor": "#fce4ec", "pencolor": "#880e4f"}):
        ds_notif = Storage("notifications\n{ user_id, message,\ntype, is_read }")

    # ── Process 6: Status Tracking ────────────────────────────────
    with Cluster("P6: Track Request Status\n(GET /api/requests — poll every 15s)", graph_attr={"bgcolor": "#fff9c4", "pencolor": "#f9a825"}):
        p6_status = React("AidStatusView\n(Victim Dashboard)")

    # ── Admin Oversight ───────────────────────────────────────────
    with Cluster("P7: Admin Dashboard\n(GET /api/analytics + /requests)", graph_attr={"bgcolor": "#ede7f6", "pencolor": "#4527a0"}):
        p7_admin = React("AdminDashboard\nKPI: Resolution Rate,\nActive Requests")

    # ─────────────────────────────────────────────────────────────
    # FLOW CONNECTIONS
    # ─────────────────────────────────────────────────────────────

    # Step 1: Victim fills form
    victim >> Edge(label="Fills form", color="#e65100", style="bold") >> p1_form
    victim >> Edge(label="Grants GPS", color="#e65100", style="dashed") >> p1_gps
    p1_gps >> Edge(label="lat/lng", color="#555") >> p1_form

    # Step 2: Form → API → DB (status: pending)
    p1_form >> Edge(label="POST request data\n+ Bearer JWT", color="#2e7d32", style="bold") >> p2_auth
    p2_auth >> Edge(label="Validated", color="#2e7d32") >> p2_insert
    p2_insert >> Edge(label="INSERT (status=pending)", color="#880e4f", style="bold") >> ds_req

    # Step 3: Volunteer polls feed
    ds_req >> Edge(label="SELECT pending requests", color="#1565c0") >> p3_poll
    p3_poll >> Edge(label="Sorted task list", color="#1565c0") >> p3_feed
    volunteer >> Edge(label="Views feed", color="#1565c0") >> p3_feed

    # Step 4: Volunteer claims task
    p3_feed >> Edge(label="Claim action", color="#2e7d32", style="bold") >> p4_lock
    p4_lock >> Edge(label="UPDATE status=in_progress", color="#880e4f", style="bold") >> ds_req
    p4_lock >> Edge(label="Conflict: return 409", color="#cc0000", style="dashed") >> volunteer
    p4_lock >> Edge(label="INSERT task record", color="#880e4f") >> p4_join
    p4_join >> Edge(label="Writes", color="#880e4f") >> ds_task

    # Step 5: Volunteer completes task
    volunteer >> Edge(label="Mark complete", color="#2e7d32", style="bold") >> p5_complete
    p5_complete >> Edge(label="UPDATE status=resolved", color="#880e4f", style="bold") >> ds_req
    p5_complete >> Edge(label="INSERT notifications", color="#880e4f") >> p5_notif
    p5_notif >> Edge(label="Writes", color="#880e4f") >> ds_notif

    # Step 6: Victim polls status
    victim >> Edge(label="Polls every 15s", color="#e65100", style="dashed") >> p6_status
    ds_req >> Edge(label="SELECT status by user_id", color="#e65100") >> p6_status

    # Step 7: Notifications reach victim/admin
    ds_notif >> Edge(label="Unread alerts", color="#555", style="dashed") >> victim
    ds_notif >> Edge(label="Unread alerts", color="#555", style="dashed") >> admin

    # Admin oversight
    admin >> Edge(label="Monitors", color="#4527a0", style="dashed") >> p7_admin
    ds_req >> Edge(label="Aggregated metrics", color="#4527a0") >> p7_admin

print("Done! Diagram saved as: drrms_dfd_aid_request.png")
