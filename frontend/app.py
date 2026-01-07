import streamlit as st
import requests
import pandas as pd
import plotly.express as px
import json
import os
from datetime import datetime

API_URL = "http://127.0.0.1:8000"
ATTACKS_FILE = "Security/attacks.csv"
LOG_FILE = "Security/audit_log.jsonl"

# -----------------------------
# PAGE CONFIG
# -----------------------------
st.set_page_config(
    page_title="PrivGuard Enterprise Gateway",
    page_icon="🛡️",
    layout="wide"
)

st.title("🛡️ PrivGuard — AI Privacy & Security Gateway")
st.caption("Hybrid Routing • RBAC Policies • Tamper-Proof Audit Chain")

st.sidebar.header("User Simulation")
user_role = st.sidebar.selectbox(
    "Active Role",
    ["Student", "Researcher", "Employee", "Admin"]
)

st.sidebar.divider()
st.sidebar.write("Gateway Version: **v0.2**")

tab1, tab2, tab3 = st.tabs([
    "⚡ Live Inspector",
    "🧪 Attack Suite",
    "📊 SOC Dashboard"
])


# -------------------------------------------------
# TAB 1 — LIVE POLICY INSPECTOR
# -------------------------------------------------
with tab1:
    st.subheader("⚡ Real-Time Request Inspector")

    text = st.text_area("Enter prompt to test policy enforcement:", height=140)

    col1, col2 = st.columns(2)
    with col1:
        run_btn = st.button("Scan Request")

    if run_btn and text.strip():

        resp = requests.post(
            f"{API_URL}/proxy",
            json={"text": text, "user_role": user_role},
            headers={"x-user-role": user_role}
        )

        data = resp.json()

        st.write("### 🔎 Gateway Decision")
        st.json(data)

        # Soft KPIs panel
        k1, k2, k3 = st.columns(3)
        k1.metric("Risk Level", data.get("risk_level", "—"))
        k2.metric("Action", data.get("action", "—"))
        k3.metric("Route", data.get("action", "—").replace("ROUTED_TO_", ""))

        st.success("Event recorded in tamper-proof audit log.")


# -------------------------------------------------
# TAB 2 — ATTACK SUITE RUNNER
# -------------------------------------------------
with tab2:

    st.subheader("🧪 Automated Red-Team Attack Suite")

    if not os.path.exists(ATTACKS_FILE):
        st.error("attacks.csv not found in Security/. Ask your teammate to commit it.")
    else:
        df = pd.read_csv(ATTACKS_FILE)
        st.caption("Attack vectors loaded from Security/attacks.csv")
        st.dataframe(df.head(10), use_container_width=True)

        if st.button(f"🚀 Run Attack Campaign ({len(df)} tests)"):

            results = []
            progress = st.progress(0)

            for i, row in df.iterrows():

                progress.progress((i+1) / len(df))

                resp = requests.post(
                    f"{API_URL}/proxy",
                    json={"text": row['prompt'], "user_role": row['role']},
                    headers={"x-user-role": row['role']}
                )

                out = resp.json()
                actual = out.get("action", "UNKNOWN")

                expected = row['expected_action']
                status = "✅ PASS" if expected in actual else "❌ FAIL"

                results.append({
                    "Attack ID": row['attack_id'],
                    "Type": row['attack_type'],
                    "Role": row['role'],
                    "Expected": expected,
                    "Actual": actual,
                    "Status": status
                })

            res = pd.DataFrame(results)

            st.write("### 🧩 Test Results")
            st.dataframe(res, use_container_width=True)

            pass_rate = len(res[res["Status"] == "✅ PASS"]) / len(res)
            st.metric("Defense Success Rate", f"{pass_rate*100:.0f}%")

            st.info("All actions + routing decisions were also recorded in audit log.")


# -------------------------------------------------
# TAB 3 — SECURITY OPERATIONS DASHBOARD
# -------------------------------------------------
with tab3:

    st.subheader("📊 Security Monitoring & Audit Chain")

    if not os.path.exists(LOG_FILE):
        st.warning("No audit log found yet — run some scans or attacks first.")
    else:
        logs = []
        with open(LOG_FILE, "r") as f:
            for line in f:
                logs.append(json.loads(line))

        if not logs:
            st.info("Audit log is currently empty.")
        else:
            df = pd.DataFrame(logs)

            # ---------- KPI Cards ----------
            c1, c2, c3, c4 = st.columns(4)

            c1.metric("Total Requests", len(df))
            c2.metric("Blocked Threats", len(df[df["policy_action"] == "BLOCK"]))
            c3.metric("Safe-Mode Routes", len(df[df["routing_decision"] == "SAFE_MODE"]))
            c4.metric("High-Risk Incidents", len(df[df["detected_risk_level"] == "HIGH"]))

            st.divider()

            # ---------- Charts ----------
            g1, g2 = st.columns(2)

            with g1:
                st.write("### 🟣 Risk Distribution")
                risk_counts = df["detected_risk_level"].value_counts().reset_index()
                risk_counts.columns = ["risk", "count"]
                fig = px.pie(risk_counts, names="risk", values="count", hole=0.45)
                st.plotly_chart(fig, use_container_width=True)

            with g2:
                st.write("### 🟡 Policy Actions")
                act_counts = df["policy_action"].value_counts().reset_index()
                act_counts.columns = ["action", "count"]
                fig2 = px.bar(act_counts, x="action", y="count")
                st.plotly_chart(fig2, use_container_width=True)

            st.divider()

            # ---------- Hash Chain Table ----------
            st.write("### 🔐 Tamper-Proof Audit Trail (Hash-Linked)")

            st.caption("Each log entry is chained using SHA-256 to prevent tampering.")

            st.dataframe(
                df[
                    [
                        "timestamp_utc",
                        "user_role",
                        "policy_action",
                        "routing_decision",
                        "current_log_hash"
                    ]
                ].tail(12),
                use_container_width=True
            )
