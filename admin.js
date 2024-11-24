document.addEventListener('DOMContentLoaded', () => {
    loadTeams();
    loadPlayers();
    loadGames();
});

function loadTeams() {
    fetch('http://localhost:9019/api/teams')
        .then(response => response.json())
        .then(teams => {
            const teamsTable = document.querySelector('#teamsTable tbody');
            teamsTable.innerHTML = '';
            teams.forEach(team => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${team.name}</td>
                    <td>${team.player1}</td>
                    <td>${team.player2}</td>
                    <td>
                        <button onclick="editTeam('${team.id}')">Edit</button>
                        <button onclick="deleteTeam('${team.id}')">Delete</button>
                    </td>
                `;
                teamsTable.appendChild(row);
            });
        })
        .catch(error => console.error('Error loading teams:', error));
}

function loadPlayers() {
    fetch('http://localhost:9019/api/players')
        .then(response => response.json())
        .then(players => {
            const playersTable = document.querySelector('#playersTable tbody');
            playersTable.innerHTML = '';
            players.forEach(player => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${player.name}</td>
                    <td>${player.team}</td>
                    <td>
                        <button onclick="editPlayer('${player.id}')">Edit</button>
                        <button onclick="deletePlayer('${player.id}')">Delete</button>
                    </td>
                `;
                playersTable.appendChild(row);
            });
        })
        .catch(error => console.error('Error loading players:', error));
}

function loadGames() {
    fetch('http://localhost:9019/api/games')
        .then(response => response.json())
        .then(games => {
            const gamesTable = document.querySelector('#gamesTable tbody');
            gamesTable.innerHTML = '';
            games.forEach(game => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${game.id}</td>
                    <td>${game.team1}</td>
                    <td>${game.team2}</td>
                    <td>${game.score}</td>
                    <td>${new Date(game.date).toLocaleDateString()}</td>
                    <td>
                        <button onclick="editGame('${game.id}')">Edit</button>
                        <button onclick="deleteGame('${game.id}')">Delete</button>
                    </td>
                `;
                gamesTable.appendChild(row);
            });
        })
        .catch(error => console.error('Error loading games:', error));
}

// Function to handle adding a new team
function addNewTeam() {
    const form = document.getElementById('teamForm');
    document.getElementById('formTitle').textContent = 'Add New Team';
    form.style.display = 'block';

    // Set form submission for adding a team
    document.getElementById('editTeamForm').onsubmit = function (event) {
        event.preventDefault();
        const teamData = {
            name: document.getElementById('teamName').value,
            player1: document.getElementById('player1').value,
            player2: document.getElementById('player2').value,
        };

        fetch('http://localhost:9019/api/teams', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(teamData),
        })
            .then(response => {
                if (response.ok) {
                    loadTeams();
                    form.style.display = 'none';
                }
            })
            .catch(error => console.error('Error adding team:', error));
    };
}

// Function to handle adding/editing a player
function addNewPlayer() {
    const form = document.getElementById('playerForm');
    document.getElementById('playerFormTitle').textContent = 'Add New Player';
    form.style.display = 'block';

    document.getElementById('editPlayerForm').onsubmit = function (event) {
        event.preventDefault();
        const playerData = {
            name: document.getElementById('playerName').value,
            team: document.getElementById('teamNameForPlayer').value,
        };

        fetch('http://localhost:9019/api/players', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(playerData),
        })
            .then(response => {
                if (response.ok) {
                    loadPlayers();
                    form.style.display = 'none';
                }
            })
            .catch(error => console.error('Error adding player:', error));
    };
}

// Functions for editing and deleting teams, players, and games will follow a similar pattern