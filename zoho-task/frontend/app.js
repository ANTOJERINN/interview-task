
  // LOGIN

function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const errorBox = document.getElementById("error");

  fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `username=${username}&password=${password}`
  })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        errorBox.innerText = data.error;
        return;
      }

      localStorage.setItem("role_id", data.role_id);
      localStorage.setItem("is_admin", data.is_admin);

      window.location.href = data.is_admin ? "admin.html" : "user.html";
    })
    .catch(() => errorBox.innerText = "Server error");
}

   //ADMIN DASHBOARD REDIRECTS

function openRoles() {
  window.location.href = "admin_roles.html";
}

function openUsers() {
  window.location.href = "admin_users.html";
}

function openPermissions() {
  window.location.href = "admin_permissions.html";
}


   //ADMIN ROLES PAGE

function loadRoles() {
  fetch("/admin/roles")
    .then(res => res.json())
    .then(data => {
      const table = document.getElementById("rolesTable");
      table.innerHTML = "";

      data.forEach(r => {
        table.innerHTML += `
          <tr>
            <td><span class="badge">#${r.id}</span></td>
            <td>${r.name}</td>
          </tr>
        `;
      });
    });
}

function addRole() {
  alert("Add Role feature coming next ");
}


   //ADMIN USERS PAGE

function loadUsersPage() {
  Promise.all([
    fetch("/admin/users").then(r => r.json()),
    fetch("/admin/roles").then(r => r.json())
  ]).then(([users, roles]) => {

    const table = document.getElementById("usersTable");
    table.innerHTML = `
      <tr>
        <th>ID</th>
        <th>User</th>
        <th>Role</th>
        <th>Save</th>
      </tr>
    `;

    users.forEach(u => {
      let opts = "";
      roles.forEach(r => {
        opts += `<option value="${r.id}" ${r.id === u.role_id ? "selected" : ""}>${r.name}</option>`;
      });

      table.innerHTML += `
        <tr>
          <td>${u.id}</td>
          <td>${u.username}</td>
          <td>
            <select id="role_${u.id}">
              ${opts}
            </select>
          </td>
          <td>
            <button onclick="saveUserRole(${u.id})">Save</button>
          </td>
        </tr>
      `;
    });
  });
}

function saveUserRole(userId) {
  const roleId = document.getElementById(`role_${userId}`).value;

  fetch("/admin/update-role", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: userId,
      role_id: parseInt(roleId)
    })
  })
    .then(res => res.json())
    .then(() => alert("Role updated successfully"));
}


  // ADMIN PERMISSIONS PAGE

function loadPermissions() {
  fetch("/admin/permissions")
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById("permissions");
      container.innerHTML = "";

      data.forEach(p => {
        const perms = JSON.parse(p.permissions);

        let fieldsHTML = "";
        for (const f in perms.fields) {
          fieldsHTML += `
            <label>
              <input type="checkbox" ${perms.fields[f].view ? "checked" : ""} disabled>
              ${f}
            </label>
          `;
        }

        container.innerHTML += `
          <div class="permission-card">
            <h3>Role: ${p.role}</h3>
            <div class="meta">Table: ${p.table}</div>

            <div class="checks">
              <label>
                <input type="checkbox" ${perms.table.view ? "checked" : ""} disabled>
                View
              </label>
              <label>
                <input type="checkbox" ${perms.table.edit ? "checked" : ""} disabled>
                Edit
              </label>
            </div>

            <div class="section-title">Fields</div>
            <div class="checks">${fieldsHTML}</div>
          </div>
        `;
      });
    });
}

   //USER ACCOUNTS PAGE

function goAccounts() {
  window.location.href = "user_accounts.html";
}

function goTransactions() {
  window.location.href = "user_transactions.html";
}

function goPermissions() {
  window.location.href = "user_permissions.html";
}


   //USER ACCOUNTS PAGE

function loadUserAccounts() {
  const roleId = localStorage.getItem("role_id");

  Promise.all([
    fetch(`/customers?role_id=${roleId}`).then(r => r.json()),
    fetch(`/accounts?role_id=${roleId}`).then(r => r.json())
  ]).then(([customers, accounts]) => {

    const tbody = document.querySelector("#accountsTable tbody");
    tbody.innerHTML = "";

    customers.forEach(c => {
      const acc = accounts.find(a => a.customer_id === c.id);
      if (!acc) return;

      tbody.innerHTML += `
        <tr>
          <td>${c.name}</td>
          <td>${c.email}</td>
          <td>${c.phone}</td>
          <td>${acc.account_number}</td>
          <td>₹ ${acc.balance}</td>
        </tr>
      `;
    });
  });
}


   //USER TRANSACTIONS PAGE

function loadTransactions() {
  const roleId = localStorage.getItem("role_id");

  fetch(`/transactions?role_id=${roleId}`)
    .then(res => {
      if (!res.ok) throw new Error("Access denied");
      return res.json();
    })
    .then(data => {
      const tbody = document.querySelector("#transactionsTable tbody");
      tbody.innerHTML = "";

      data.forEach(t => {
        const cls = t.type === "credit" ? "credit" : "debit";

        tbody.innerHTML += `
          <tr>
            <td>${t.account_id}</td>
            <td class="${cls}">${t.type}</td>
            <td class="${cls}">₹ ${t.amount}</td>
            <td>${t.created_at}</td>
          </tr>
        `;
      });
    })
    .catch(err => {
      console.error(err);
      alert("You don’t have permission to view transactions");
    });
}


  // USER PERMISSIONS PAGE

function loadUserPermissions() {
  fetch("/admin/permissions")
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById("permissions");
      container.innerHTML = "";

      data.forEach(p => {
        const perms = JSON.parse(p.permissions);

        let fieldsHTML = "";
        for (const f in perms.fields) {
          fieldsHTML += `
            <div class="field">
              <span>${f}</span>
              <span class="small">
                ${perms.fields[f].view ? "👁 View" : ""}
                ${perms.fields[f].edit ? "✏ Edit" : ""}
              </span>
            </div>
          `;
        }

        container.innerHTML += `
          <div class="card">
            <div class="card-header">
              <h3>${p.table}</h3>
              <div>
                <span class="badge ${perms.table.view ? "green" : "red"}">
                  View
                </span>
                <span class="badge ${perms.table.edit ? "green" : "red"}">
                  Edit
                </span>
              </div>
            </div>

            <div class="fields">
              ${fieldsHTML}
            </div>
          </div>
        `;
      });
    })
    .catch(err => console.error(err));
}
