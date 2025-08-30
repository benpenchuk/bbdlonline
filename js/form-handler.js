// Form handler for Add Team page
document.addEventListener('DOMContentLoaded', function() {
    const teamForm = document.getElementById('team-form');
    
    if (teamForm) {
        teamForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const teamName = document.getElementById('team-name').value;
            const player1 = document.getElementById('player-1').value;
            const player2 = document.getElementById('player-2').value;
            
            // Basic validation
            if (!teamName || !player1 || !player2) {
                alert('Please fill in all fields');
                return;
            }
            
            // For now, just show a success message
            // In a real deployment, this would send data to a server
            alert(`Team "${teamName}" with players ${player1} and ${player2} has been submitted!`);
            
            // Reset form
            teamForm.reset();
        });
    }
});
