let currentSortIndex = -1;
let currentSortDirection = 'asc';

function sortTable(n) {
  console.log('Sorting column:', n); // Debug line

  const table = document.getElementById('standingsTable');
  let rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0;
  switching = true;
  dir = currentSortIndex === n && currentSortDirection === 'asc' ? 'desc' : 'asc';
  currentSortIndex = n;
  currentSortDirection = dir;

  while (switching) {
    switching = false;
    rows = table.rows;
    for (i = 1; i < (rows.length - 1); i++) {
      shouldSwitch = false;
      x = rows[i].getElementsByTagName('td')[n];
      y = rows[i + 1].getElementsByTagName('td')[n];

      // Parse content as a number if applicable, otherwise use as string
      let xContent = parseFloat(x.innerHTML.trim());
      let yContent = parseFloat(y.innerHTML.trim());

      // Check if content is numeric, if not, treat as a string
      if (isNaN(xContent)) xContent = x.innerHTML.trim().toLowerCase();
      if (isNaN(yContent)) yContent = y.innerHTML.trim().toLowerCase();

      console.log(`Comparing ${xContent} and ${yContent}`); // Debug line

      if ((dir === 'asc' && xContent > yContent) || (dir === 'desc' && xContent < yContent)) {
        shouldSwitch = true;
        break;
      }
    }
    if (shouldSwitch) {
      rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
      switching = true;
      switchcount++;
    } else {
      if (switchcount === 0 && dir === 'asc') {
        dir = 'desc';
        switching = true;
      }
    }
  }

  updateArrows(n, dir);
}

function updateArrows(columnIndex, direction) {
  const headers = document.querySelectorAll('th .sort-arrow');
  headers.forEach((arrow, index) => {
    arrow.textContent = index === columnIndex ? (direction === 'asc' ? '⇧' : '⇩') : '⇅';
  });
}

function filterTable() {
  const input = document.getElementById('searchTeam');
  const filter = input.value.toUpperCase();
  const table = document.getElementById('standingsTable');
  const tr = table.getElementsByTagName('tr');

  for (let i = 1; i < tr.length; i++) {
    const td = tr[i].getElementsByTagName('td')[1]; // Index 1 for team name
    if (td) {
      const txtValue = td.textContent || td.innerText;
      tr[i].style.display = txtValue.toUpperCase().indexOf(filter) > -1 ? '' : 'none';
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  fetch('http://localhost:9019/api/leaderboard')
    .then(response => response.json())
    .then(data => {
      const leaderboardTable = document.querySelector('#leaderboard-table tbody');
      leaderboardTable.innerHTML = ''; // Clear any existing rows

      data.forEach((team, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${index + 1}</td>
          <td>${team.name}</td>
          <td>${team.player1}</td>
          <td>${team.player2}</td>
          <td>${team.wins}</td>
          <td>${team.losses}</td>
          <td>${team.pointsFor}</td>
          <td>${team.pointsAgainst}</td>
        `;
        leaderboardTable.appendChild(row);
      });
    })
    .catch(error => console.error('Error fetching leaderboard data:', error));
});