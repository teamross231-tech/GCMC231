
const STORAGE_KEY = "gcm_church_management_data";
const LOGIN_KEY = "gcm_admin_logged_in";


function getData() {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
        return structuredClone(defaultData);
    }

    return JSON.parse(saved);
}

function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function formatMoney(value) {
    return new Intl.NumberFormat("en-LR", {
        style: "currency",
        currency: "LRD",
        maximumFractionDigits: 0
    }).format(Number(value) || 0);
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return entities[character];
    });
}

function showToast(message) {
    const toast = document.getElementById("toast");

    if (!toast) {
        return;
    }

    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2200);
}

function openModal(id) {
    document.getElementById(id)?.classList.add("show");
}

function closeModal(id) {
    document.getElementById(id)?.classList.remove("show");
}

function logout() {
    localStorage.removeItem(LOGIN_KEY);
    window.location.href = "login.html";
}

function requireLogin() {
    if (localStorage.getItem(LOGIN_KEY) !== "true") {
        window.location.href = "login.html";
    }
}

function setupNavigation(activePage) {
    requireLogin();

    const sidebar = document.querySelector(".sidebar");

    if (!sidebar) {
        return;
    }

    const links = [
        ["dashboard.html", "📊", "Dashboard"],
        ["members.html", "👥", "Members"],
        ["leadership.html", "👨‍💼", "Leadership"],
        ["attendance.html", "✅", "Attendance"],
        ["ministries.html", "⛪", "Ministries"],
        ["events.html", "📅", "Events"],
        ["finance.html", "💰", "Finance & Expenditure"],
        ["tax.html", "🧾", "Tax & Compliance"],
        ["donations.html", "🎁", "Donations"],
        ["assets.html", "🏢", "Assets"],
        ["reports.html", "📈", "Reports"],
        ["users.html", "🔐", "Administrators"],
        ["settings.html", "⚙️", "Settings"]
    ];

    sidebar.innerHTML = `
        <div class="brand">
            <div class="brand-logo">GC</div>
            <div>
                <h1>Great Commission Ministries</h1>
                <span>Church Management System</span>
            </div>
        </div>

        <nav class="nav">
            <div class="nav-title">Main Menu</div>

            ${links.map(link => `
                <a
                    class="nav-link ${link[2] === activePage ? "active" : ""}"
                    href="${link[0]}"
                >
                    <span>${link[1]}</span>
                    <span>${link[2]}</span>
                </a>
            `).join("")}

            <div class="nav-title">Account</div>

            <a class="nav-link" href="#" onclick="logout(); return false;">
                <span>🚪</span>
                <span>Logout</span>
            </a>
        </nav>
    `;

    const menuButton = document.querySelector(".menu-button");

    menuButton?.addEventListener("click", () => {
        sidebar.classList.toggle("open");
    });
}

function setupLogin() {
    const form = document.getElementById("loginForm");

    if (!form) {
        return;
    }

    form.addEventListener("submit", event => {
        event.preventDefault();

        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value;
        const error = document.getElementById("loginError");

        if (
            (username === "GCMC" ||
                username === "admin@greatcommission.org") &&
            password === "GCMC@123"
        ) {
            localStorage.setItem(LOGIN_KEY, "true");
            window.location.href = "dashboard.html";
            return;
        }

        error.classList.add("show");
    });
}

function loadDashboard() {
    const data = getData();

    const income = data.transactions
        .filter(item => item.type === "Income")
        .reduce((sum, item) => sum + Number(item.amount), 0);

    const expense = data.transactions
        .filter(item => item.type === "Expense")
        .reduce((sum, item) => sum + Number(item.amount), 0);

    document.getElementById("memberCount").textContent =
        data.members.length;

    document.getElementById("activeMembers").textContent =
        data.members.filter(item => item.status === "Active").length;

    document.getElementById("income").textContent =
        formatMoney(income);

    document.getElementById("expense").textContent =
        formatMoney(expense);

    document.getElementById("balance").textContent =
        formatMoney(income - expense);

    document.getElementById("upcomingEvents").innerHTML =
        data.events.map(event => `
            <tr>
                <td>${escapeHTML(event.title)}</td>
                <td>${event.date}</td>
                <td>${event.time}</td>
                <td>${escapeHTML(event.location)}</td>
            </tr>
        `).join("");

    document.getElementById("recentTransactions").innerHTML =
        data.transactions
            .slice()
            .reverse()
            .map(transaction => `
                <tr>
                    <td>${transaction.date}</td>
                    <td>${escapeHTML(transaction.description)}</td>
                    <td>${transaction.type}</td>
                    <td>${formatMoney(transaction.amount)}</td>
                </tr>
            `)
            .join("");
}

function renderMembers() {
    const data = getData();
    const search = document
        .getElementById("memberSearch")
        .value
        .toLowerCase();

    const members = data.members.filter(member =>
        Object.values(member)
            .join(" ")
            .toLowerCase()
            .includes(search)
    );

    document.getElementById("membersTable").innerHTML =
        members.map(member => `
            <tr>
                <td>${member.id}</td>
                <td><strong>${escapeHTML(member.name)}</strong></td>
                <td>${escapeHTML(member.gender)}</td>
                <td>${escapeHTML(member.phone)}</td>
                <td>${escapeHTML(member.ministry)}</td>
                <td>
                    <span class="badge ${member.status === "Active"
                ? "badge-green"
                : "badge-gray"
            }">
                        ${escapeHTML(member.status)}
                    </span>
                </td>
                <td>
                    <button
                        class="btn btn-danger"
                        onclick="deleteMember(${member.id})"
                    >
                        Delete
                    </button>
                </td>
            </tr>
        `).join("");
}

function deleteMember(id) {
    if (!confirm("Delete this member?")) {
        return;
    }

    const data = getData();

    data.members = data.members.filter(member => member.id !== id);

    saveData(data);
    renderMembers();
    showToast("Member deleted.");
}

function setupMembers() {
    document
        .getElementById("memberSearch")
        .addEventListener("input", renderMembers);

    document
        .getElementById("memberForm")
        .addEventListener("submit", event => {
            event.preventDefault();

            const form = event.target;
            const data = getData();

            data.members.push({
                id: Date.now(),
                name: form.name.value,
                gender: form.gender.value,
                phone: form.phone.value,
                email: form.email.value,
                ministry: form.ministry.value,
                status: form.status.value,
                joined: form.joined.value
            });

            saveData(data);
            form.reset();
            closeModal("memberModal");
            renderMembers();
            showToast("Member saved successfully.");
        });

    renderMembers();
}

function setupLeadership() {
    const data = getData();

    document.getElementById("leadersTable").innerHTML =
        data.leaders.map(leader => `
            <tr>
                <td>${escapeHTML(leader.name)}</td>
                <td>${escapeHTML(leader.role)}</td>
                <td>${escapeHTML(leader.phone)}</td>
                <td>${escapeHTML(leader.email)}</td>
                <td>${escapeHTML(leader.term)}</td>
            </tr>
        `).join("");

    document
        .getElementById("leaderForm")
        .addEventListener("submit", event => {
            event.preventDefault();

            const form = event.target;
            const data = getData();

            data.leaders.push({
                id: Date.now(),
                name: form.name.value,
                role: form.role.value,
                phone: form.phone.value,
                email: form.email.value,
                term: form.term.value
            });

            saveData(data);
            form.reset();
            setupLeadership();
            showToast("Leadership member added.");
        });
}

function setupFinance() {
    renderFinance();

    document
        .getElementById("financeForm")
        .addEventListener("submit", event => {
            event.preventDefault();

            const form = event.target;
            const data = getData();

            data.transactions.push({
                id: Date.now(),
                type: form.type.value,
                category: form.category.value,
                description: form.description.value,
                amount: Number(form.amount.value),
                date: form.date.value,
                method: form.method.value
            });

            saveData(data);
            form.reset();
            renderFinance();
            showToast("Transaction recorded.");
        });
}

function renderFinance() {
    const data = getData();

    const income = data.transactions
        .filter(item => item.type === "Income")
        .reduce((sum, item) => sum + Number(item.amount), 0);

    const expense = data.transactions
        .filter(item => item.type === "Expense")
        .reduce((sum, item) => sum + Number(item.amount), 0);

    document.getElementById("financeIncome").textContent =
        formatMoney(income);

    document.getElementById("financeExpense").textContent =
        formatMoney(expense);

    document.getElementById("financeBalance").textContent =
        formatMoney(income - expense);

    document.getElementById("financeTable").innerHTML =
        data.transactions.map(item => `
            <tr>
                <td>${item.date}</td>
                <td>${escapeHTML(item.type)}</td>
                <td>${escapeHTML(item.category)}</td>
                <td>${escapeHTML(item.description)}</td>
                <td>${formatMoney(item.amount)}</td>
                <td>${escapeHTML(item.method)}</td>
                <td>
                    <button
                        class="btn btn-danger"
                        onclick="deleteTransaction(${item.id})"
                    >
                        Delete
                    </button>
                </td>
            </tr>
        `).join("");
}

function deleteTransaction(id) {
    const data = getData();

    data.transactions = data.transactions.filter(
        item => item.id !== id
    );

    saveData(data);
    renderFinance();
    showToast("Transaction deleted.");
}

function setupGenericModule(type, tableId, formId, fields) {
    renderGenericModule(type, tableId, fields);

    const form = document.getElementById(formId);

    if (!form) {
        return;
    }

    form.addEventListener("submit", event => {
        event.preventDefault();

        const data = getData();
        const item = {
            id: Date.now()
        };

        fields.forEach(field => {
            const input = form.elements[field];

            if (!input) {
                return;
            }

            item[field] =
                input.type === "number"
                    ? Number(input.value)
                    : input.value;
        });

        data[type].push(item);

        saveData(data);
        form.reset();

        renderGenericModule(type, tableId, fields);
        showToast("Record saved successfully.");
    });
}

function renderGenericModule(type, tableId, fields) {
    const data = getData();
    const table = document.getElementById(tableId);

    if (!table) {
        return;
    }

    table.innerHTML = data[type]
        .map(item => `
            <tr>
                ${fields.map(field => `
                    <td>${escapeHTML(item[field])}</td>
                `).join("")}

                <td>
                    <button
                        class="btn btn-danger"
                        onclick="deleteGeneric('${type}', ${item.id})"
                    >
                        Delete
                    </button>
                </td>
            </tr>
        `)
        .join("");
}

function deleteGeneric(type, id) {
    const data = getData();

    data[type] = data[type].filter(item => item.id !== id);

    saveData(data);
    window.location.reload();
}

function setupTax() {
    const data = getData();

    const income = data.transactions
        .filter(item => item.type === "Income")
        .reduce((sum, item) => sum + Number(item.amount), 0);

    const expense = data.transactions
        .filter(item => item.type === "Expense")
        .reduce((sum, item) => sum + Number(item.amount), 0);

    document.getElementById("taxIncome").textContent = formatMoney(income);
    document.getElementById("taxExpense").textContent = formatMoney(expense);
    document.getElementById("taxNet").textContent =
        formatMoney(income - expense);
}

function setupReports() {
    const data = getData();

    const income = data.transactions
        .filter(item => item.type === "Income")
        .reduce((sum, item) => sum + Number(item.amount), 0);

    const expense = data.transactions
        .filter(item => item.type === "Expense")
        .reduce((sum, item) => sum + Number(item.amount), 0);

    const attendance = data.attendance
        .reduce((sum, item) => sum + Number(item.present), 0);

    document.getElementById("reportIncome").textContent =
        formatMoney(income);

    document.getElementById("reportExpense").textContent =
        formatMoney(expense);

    document.getElementById("reportMembers").textContent =
        data.members.length;

    document.getElementById("reportAttendance").textContent =
        attendance;

    const categories = {};

    data.transactions
        .filter(item => item.type === "Expense")
        .forEach(item => {
            categories[item.category] =
                (categories[item.category] || 0) +
                Number(item.amount);
        });

    const values = Object.values(categories);
    const maximum = Math.max(...values, 1);

    document.getElementById("expenseChart").innerHTML =
        Object.entries(categories).map(([category, amount]) => `
            <div class="bar-column">
                <div class="bar-value">${formatMoney(amount)}</div>

                <div
                    class="bar"
                    style="height: ${Math.max(
            15,
            (amount / maximum) * 180
        )}px"
                ></div>

                <div class="bar-label">
                    ${escapeHTML(category)}
                </div>
            </div>
        `).join("");
}

function setupSettings() {
    const data = getData();
    const form = document.getElementById("settingsForm");

    form.church.value = data.settings.church;
    form.currency.value = data.settings.currency;
    form.service.value = data.settings.service;

    form.addEventListener("submit", event => {
        event.preventDefault();

        data.settings = {
            church: form.church.value,
            currency: form.currency.value,
            service: form.service.value
        };

        saveData(data);
        showToast("Settings saved.");
    });

    document.getElementById("resetData").addEventListener("click", () => {
        if (!confirm("Reset all demo data?")) {
            return;
        }

        localStorage.removeItem(STORAGE_KEY);
        window.location.reload();
    });
}

document.addEventListener("DOMContentLoaded", () => {
    if (document.body.dataset.login === "true") {
        setupLogin();
        return;
    }

    const page = document.body.dataset.page;

    if (!page) {
        return;
    }

    const pageNames = {
        dashboard: "Dashboard",
        members: "Members",
        leadership: "Leadership",
        attendance: "Attendance",
        ministries: "Ministries",
        events: "Events",
        finance: "Finance & Expenditure",
        tax: "Tax & Compliance",
        donations: "Donations",
        assets: "Assets",
        reports: "Reports",
        users: "Administrators",
        settings: "Settings"
    };

    setupNavigation(pageNames[page]);

    if (page === "dashboard") {
        loadDashboard();
    }

    if (page === "members") {
        setupMembers();
    }

    if (page === "leadership") {
        setupLeadership();
    }

    if (page === "finance") {
        setupFinance();
    }

    if (page === "attendance") {
        setupGenericModule(
            "attendance",
            "attendanceTable",
            "attendanceForm",
            ["date", "service", "present", "absent"]
        );
    }

    if (page === "events") {
        setupGenericModule(
            "events",
            "eventsTable",
            "eventsForm",
            ["title", "date", "time", "location", "status"]
        );
    }

    if (page === "donations") {
        setupGenericModule(
            "donations",
            "donationsTable",
            "donationsForm",
            ["date", "donor", "purpose", "amount"]
        );
    }

    if (page === "assets") {
        setupGenericModule(
            "assets",
            "assetsTable",
            "assetsForm",
            ["name", "category", "value", "status"]
        );
    }

    if (page === "tax") {
        setupTax();
    }

    if (page === "reports") {
        setupReports();
    }

    if (page === "settings") {
        setupSettings();
    }
});
