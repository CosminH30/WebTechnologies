document.addEventListener('DOMContentLoaded', loadUsers);

async function loadUsers() {
    try {
        // cerere HTTP GET catre API pentru a obtine lista de utilizatori
        const res = await fetch('/api/admin/users');
        if (!res.ok) throw new Error('Eroare la încărcarea utilizatorilor');
        const users = await res.json();
        // corpul tabelului unde vor fi afisati utilizatorii
        const tbody = document.querySelector('#users-table tbody');
        tbody.innerHTML = '';
        users.forEach(u => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
        <td>${u.id}</td>
        <td>${u.username}</td>
        <td>
          <button onclick="deleteUser(${u.id})">Sterge</button>
        </td>`;
            tbody.appendChild(tr);
        });
    } catch (e) {
        alert(e.message);
    }
}

async function deleteUser(id) {
    if (!confirm('Sigur vrei să stergi utilizatorul?')) return;
    // cerere HTTP DELETE catre API pentru a sterge utilizatorul
    const res = await fetch(`/api/admin/users/${id}`, {method: 'DELETE'});
    if (res.status === 204) loadUsers();
    else {
        const text = await res.text();
        alert(`Nu s-a putut sterge: ${text}`);
    }
}
