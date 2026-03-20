window.addEventListener('DOMContentLoaded', () => {
    const shutter = document.getElementById('main-shutter');
    if (sessionStorage.getItem('triggerBarnDoor') === 'true') {
        sessionStorage.removeItem('triggerBarnDoor');
        if (shutter) {
            shutter.style.display = 'block';
            shutter.classList.add('active');
            void shutter.offsetWidth; 
            setTimeout(() => {
                shutter.classList.add('open');
                setTimeout(() => {
                    shutter.style.display = 'none';
                    shutter.classList.remove('active', 'open');
                }, 800);
            }, 100);
        }
    } else {
        if (shutter) {
            shutter.style.display = 'none';
        }
    }

    const buttonsContainer = document.querySelector('.pl-buttons-container');
    const nameContainer = document.getElementById('selected-product-name-container');

    if (!canEditProducts) {
        if (buttonsContainer) buttonsContainer.style.display = 'none';
        if (nameContainer) nameContainer.style.display = 'flex';
    } else {
        if (buttonsContainer) buttonsContainer.style.display = 'flex';
        if (nameContainer) nameContainer.style.display = 'none';
    }
    
    renderYearButtons();
    
    if (sessionStorage.getItem('activeTab') === 'Dashboard' || !sessionStorage.getItem('activeTab')) {
        updateDashboard();
    }
});

const activeUser = sessionStorage.getItem('activeUser');
let userRole = sessionStorage.getItem('userRole');

if (!userRole || userRole === 'undefined' || userRole === 'null') {
    userRole = activeUser === 'Admin' ? 'Inventory Manager' : 'Storekeeper / Stock Clerk';
    sessionStorage.setItem('userRole', userRole);
}

const allowedEditRoles = ['Inventory Manager', 'Warehouse Manager', 'Inventory Control Specialist', 'Inventory Analyst'];
const canEditProducts = allowedEditRoles.includes(userRole);
const restrictedRoles = ['Storekeeper / Stock Clerk', 'Purchasing Officer'];
const isRestrictedUser = restrictedRoles.includes(userRole);

const allowedAttendanceRoles = ['Inventory Manager', 'Inventory Analyst', 'Inventory Control Specialist'];
const canManageAttendance = allowedAttendanceRoles.includes(userRole);

let salesHistory = JSON.parse(localStorage.getItem('ims_sales_history')) || [];
let receiptHistory = JSON.parse(localStorage.getItem('ims_receipt_history')) || [];
let notesHistory = JSON.parse(localStorage.getItem('ims_notes_history')) || [];
let attendanceHistory = JSON.parse(localStorage.getItem('ims_attendance_history')) || [];
let feedbackHistory = JSON.parse(localStorage.getItem('ims_feedback_history')) || [];

let currentSystemYear = new Date().getFullYear();
let selectedDashboardYear = currentSystemYear;

function renderYearButtons() {
    const container = document.getElementById('dashboard-year-filters');
    if(!container) return;
    container.innerHTML = '';
    
    const years = [currentSystemYear - 2, currentSystemYear - 1, currentSystemYear];
    
    years.forEach(y => {
        const btn = document.createElement('button');
        btn.className = `year-btn ${y === selectedDashboardYear ? 'active' : ''}`;
        btn.textContent = y === currentSystemYear ? `${y} (Latest)` : y;
        btn.onclick = () => {
            selectedDashboardYear = y;
            renderYearButtons();
            updateDashboard();
        };
        container.appendChild(btn);
    });
}

if (activeUser && activeUser !== 'undefined') {
    document.querySelector('.user-role').textContent = `${activeUser} (${userRole})`;
    document.getElementById('userMgmtNav').style.display = 'flex';
    loadUserDataOnStartup();
    
    if (activeUser === 'Admin') {
        const adminSettings = document.getElementById('admin-settings-section');
        if (adminSettings) adminSettings.style.display = 'block';
    }
} else {
    window.location.href = 'Login.html';
}

const themeColors = {
    blue: { main: '#06428d', sidebar: '#619be2', accent: '#021c3a', hover: '#56beff' },
    yellow: { main: '#b38f00', sidebar: '#ffdb4d', accent: '#4d3d00', hover: '#ffe680' },
    red: { main: '#8d0606', sidebar: '#e26161', accent: '#3a0202', hover: '#ff5656' },
    pink: { main: '#8d065a', sidebar: '#e261b0', accent: '#3a0224', hover: '#ff56bf' },
    orange: { main: '#8d4806', sidebar: '#e29a61', accent: '#3a1c02', hover: '#ff9c56' },
    purple: { main: '#48068d', sidebar: '#9a61e2', accent: '#1c023a', hover: '#9c56ff' },
    green: { main: '#068d1b', sidebar: '#61e274', accent: '#023a09', hover: '#56ff6d' }
};

function applyTheme(themeName, saveToBackend = false) {
    if (!themeColors[themeName] && themeName !== 'black') themeName = 'blue';
    
    if (themeName === 'black') {
        document.body.classList.add('dark-theme');
        document.documentElement.classList.remove('pre-dark-theme-apply');
        document.documentElement.style.setProperty('--topnav-bg', '#111111');
        document.documentElement.style.setProperty('--sidebar-bg', '#222222');
        document.documentElement.style.setProperty('--accent-color', '#444444');
        document.documentElement.style.setProperty('--hover-color', '#333333');
    } else {
        document.body.classList.remove('dark-theme');
        document.documentElement.classList.remove('pre-dark-theme-apply');
        const theme = themeColors[themeName];
        document.documentElement.style.setProperty('--topnav-bg', theme.main);
        document.documentElement.style.setProperty('--sidebar-bg', theme.sidebar);
        document.documentElement.style.setProperty('--accent-color', theme.accent);
        document.documentElement.style.setProperty('--hover-color', theme.hover);
    }

    document.querySelectorAll('.theme-swatch').forEach(swatch => {
        if(swatch.getAttribute('data-theme') === themeName) {
            swatch.style.borderColor = '#333';
            swatch.style.transform = 'scale(1.15)';
            swatch.style.boxShadow = '0 4px 10px rgba(0,0,0,0.3)';
        } else {
            swatch.style.borderColor = '#ccc';
            swatch.style.transform = 'scale(1)';
            swatch.style.boxShadow = 'none';
        }
    });

    if (saveToBackend && activeUser) {
        localStorage.setItem('theme_' + activeUser, themeName);
        fetch(`http://localhost:8080/api/users/update/${activeUser}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ theme: themeName })
        }).catch(e => console.error(e));
    }
}

function applyBgColor(colorHex, saveToBackend = false) {
    document.documentElement.style.setProperty('--main-bg', colorHex);
    
    document.querySelectorAll('.bg-swatch').forEach(swatch => {
        if(swatch.getAttribute('data-bg') === colorHex) {
            swatch.style.borderColor = '#333';
            swatch.style.transform = 'scale(1.15)';
            swatch.style.boxShadow = '0 4px 10px rgba(0,0,0,0.3)';
        } else {
            swatch.style.borderColor = '#ccc';
            swatch.style.transform = 'scale(1)';
            swatch.style.boxShadow = 'none';
        }
    });

    if (saveToBackend && activeUser) {
        localStorage.setItem('bgColor_' + activeUser, colorHex);
        fetch(`http://localhost:8080/api/users/update/${activeUser}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ backgroundColor: colorHex })
        }).catch(e => console.error(e));
    }
}

document.querySelectorAll('.theme-swatch').forEach(swatch => {
    swatch.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const selectedTheme = this.getAttribute('data-theme');
        const transitionOverlay = document.getElementById('theme-transition-overlay');
        
        if (transitionOverlay) {
            transitionOverlay.classList.add('active');
            setTimeout(() => {
                applyTheme(selectedTheme, true);
                if (selectedTheme === 'black') {
                    applyBgColor('#2d2d2d', true);
                } else {
                    applyBgColor('#ffffff', true);
                }
                sessionStorage.setItem('activeTab', 'Settings');
                setTimeout(() => {
                    transitionOverlay.classList.remove('active');
                }, 100);
            }, 300);
        } else {
            applyTheme(selectedTheme, true);
            if (selectedTheme === 'black') {
                applyBgColor('#2d2d2d', true);
            } else {
                applyBgColor('#ffffff', true);
            }
            sessionStorage.setItem('activeTab', 'Settings');
        }
    });
});

document.querySelectorAll('.bg-swatch').forEach(swatch => {
    swatch.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const colorHex = this.getAttribute('data-bg');
        const transitionOverlay = document.getElementById('theme-transition-overlay');

        if (transitionOverlay) {
            transitionOverlay.classList.add('active');
            setTimeout(() => {
                applyBgColor(colorHex, true);
                sessionStorage.setItem('activeTab', 'Settings');
                setTimeout(() => {
                    transitionOverlay.classList.remove('active');
                }, 100);
            }, 300);
        } else {
            applyBgColor(colorHex, true);
            sessionStorage.setItem('activeTab', 'Settings');
        }
    });
});

const sidebar = document.getElementById('sidebar');
const toggleBtn = document.getElementById('sidebarToggle');
const navItems = document.querySelectorAll('.nav-item');
const mainContent = document.getElementById('default-content');
const umContent = document.getElementById('usermanagement-content');
const settingsContent = document.getElementById('settings-content');
const plContent = document.getElementById('productlisting-content');
const srContent = document.getElementById('salesreport-content');
const notesContent = document.getElementById('notes-content');
const attendanceContent = document.getElementById('attendance-content');
const dashboardWrapper = document.getElementById('dashboard-wrapper');
const genericContent = document.getElementById('generic-content');
const pageTitle = document.getElementById('page-title');

function hideAllViews() {
    if(mainContent) mainContent.style.display = 'none';
    if(umContent) umContent.style.display = 'none';
    if(settingsContent) settingsContent.style.display = 'none';
    if(plContent) plContent.style.display = 'none';
    if(srContent) srContent.style.display = 'none';
    if(notesContent) notesContent.style.display = 'none';
    if(attendanceContent) attendanceContent.style.display = 'none';
    if(genericContent) genericContent.style.display = 'none';
    if(dashboardWrapper) dashboardWrapper.style.display = 'none';
}

function updateClock() {
    const clockElement = document.getElementById('liveClock');
    const attendanceDateElement = document.getElementById('attendance-date-display');
    if (!clockElement) return;
    const now = new Date();
    
    if (now.getDay() === 0 && now.getHours() === 0 && now.getMinutes() === 0 && now.getSeconds() === 0) {
        localStorage.setItem('ims_weekly_in', '0');
        localStorage.setItem('ims_weekly_out', '0');
        if (sessionStorage.getItem('activeTab') === 'Dashboard') {
            updateDashboard();
        }
    }
    
    if (now.getHours() === 0 && now.getMinutes() === 0 && now.getSeconds() === 0) {
        localStorage.setItem('ims_customers_today', '0');
        if (sessionStorage.getItem('activeTab') === 'Dashboard') {
            updateDashboard();
        }
        if (sessionStorage.getItem('activeTab') === 'Attendance') {
            renderAttendanceTable(); 
        }
    }
    
    const timeString = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });
    const dateString = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    clockElement.textContent = `${timeString.toLowerCase()} - ${dateString}`;
    if (attendanceDateElement) attendanceDateElement.textContent = dateString;
}
setInterval(updateClock, 1000);
updateClock();

async function loadUserDataOnStartup() {
    try {
        const response = await fetch('http://localhost:8080/api/users/all');
        const users = await response.json();
        const user = users.find(u => u.username === activeUser);
        
        let finalTheme = 'blue';
        let finalBg = '#ffffff';

        if (user) {
            if (user.profilePicture) {
                document.getElementById('navProfilePic').src = user.profilePicture;
            }
            if (user.theme) finalTheme = user.theme;
            else if (localStorage.getItem('theme_' + activeUser)) finalTheme = localStorage.getItem('theme_' + activeUser);

            if (user.backgroundColor) finalBg = user.backgroundColor;
            else if (localStorage.getItem('bgColor_' + activeUser)) finalBg = localStorage.getItem('bgColor_' + activeUser);
        } else {
            if (localStorage.getItem('theme_' + activeUser)) finalTheme = localStorage.getItem('theme_' + activeUser);
            if (localStorage.getItem('bgColor_' + activeUser)) finalBg = localStorage.getItem('bgColor_' + activeUser);
        }

        applyTheme(finalTheme, false);
        applyBgColor(finalBg, false);

    } catch(e) { 
        console.error(e);
        applyTheme(localStorage.getItem('theme_' + activeUser) || 'blue', false);
        applyBgColor(localStorage.getItem('bgColor_' + activeUser) || '#ffffff', false);
    }
}

async function updateTopNavProfilePic() {
    try {
        const response = await fetch('http://localhost:8080/api/users/all');
        const users = await response.json();
        const user = users.find(u => u.username === activeUser);
        if (user && user.profilePicture) {
            document.getElementById('navProfilePic').src = user.profilePicture;
        }
    } catch(e) { console.error(e); }
}

function customConfirm(message) {
    return new Promise((resolve) => {
        const overlay = document.getElementById('customModalOverlay');
        const msgEl = document.getElementById('customModalMessage');
        const btnYes = document.getElementById('modalBtnYes');
        const btnNo = document.getElementById('modalBtnNo');

        msgEl.textContent = message;
        btnYes.style.display = 'inline-block';
        btnNo.style.display = 'inline-block';
        btnYes.textContent = 'YES';
        btnNo.textContent = 'NO';

        overlay.classList.remove('hiding');
        overlay.classList.add('active');

        const cleanup = () => {
            btnYes.removeEventListener('click', onYes);
            btnNo.removeEventListener('click', onNo);
            overlay.classList.add('hiding');
            setTimeout(() => {
                overlay.classList.remove('active');
                overlay.classList.remove('hiding');
            }, 300); 
        };

        const onYes = () => { cleanup(); resolve(true); };
        const onNo = () => { cleanup(); resolve(false); };

        btnYes.addEventListener('click', onYes);
        btnNo.addEventListener('click', onNo);
    });
}

function customAlert(message) {
    return new Promise((resolve) => {
        const overlay = document.getElementById('customModalOverlay');
        const msgEl = document.getElementById('customModalMessage');
        const btnYes = document.getElementById('modalBtnYes');
        const btnNo = document.getElementById('modalBtnNo');

        msgEl.textContent = message;
        btnYes.style.display = 'inline-block';
        btnNo.style.display = 'none'; 
        btnYes.textContent = 'OK';

        overlay.classList.remove('hiding');
        overlay.classList.add('active');

        const cleanup = () => {
            btnYes.removeEventListener('click', onYes);
            overlay.classList.add('hiding');
            setTimeout(() => {
                overlay.classList.remove('active');
                overlay.classList.remove('hiding');
            }, 300); 
        };

        const onYes = () => { cleanup(); resolve(true); };

        btnYes.addEventListener('click', onYes);
    });
}

toggleBtn.addEventListener('click', () => sidebar.classList.toggle('collapsed'));
document.addEventListener('mousemove', (e) => { if (e.clientX < 15 && e.clientY > 60) sidebar.classList.remove('collapsed'); });
sidebar.addEventListener('mouseleave', () => sidebar.classList.add('collapsed'));

navItems.forEach(item => {
    item.addEventListener('click', async (e) => {
        e.preventDefault();
        const target = item.getAttribute('data-target');
        
        if (target === 'Logout') {
            const confirmed = await customConfirm("ARE YOU SURE YOU WANT TO LOGOUT?");
            if (confirmed) {
                sessionStorage.removeItem('activeUser');
                sessionStorage.removeItem('userRole');
                sessionStorage.removeItem('activeTab');
                sessionStorage.removeItem('activeUMTab');
                sessionStorage.removeItem('hasLoggedIn');
                window.location.href = 'Login.html';
            }
            return;
        }

        sessionStorage.setItem('activeTab', target);

        navItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');

        hideAllViews();

        if (target === 'User Management') {
            umContent.style.display = 'block';
            const savedUMTab = sessionStorage.getItem('activeUMTab') || 'Team Members';
            const umTabNode = Array.from(document.querySelectorAll('.um-nav-item')).find(i => i.getAttribute('data-um-target') === savedUMTab);
            if (umTabNode) umTabNode.click();
            pageTitle.innerText = 'User Management';
        } else if (target === 'Settings') {
            settingsContent.style.display = 'block';
            pageTitle.innerText = 'Settings';
        } else if (target === 'Product Listing') {
            plContent.style.display = 'flex'; 
            renderProducts();
            pageTitle.innerText = 'Product Listing';
        } else if (target === 'Sales Report') {
            if (srContent) {
                srContent.style.display = 'block';
                renderSalesReports();
            }
            pageTitle.innerText = 'Sales Report';
        } else if (target === 'Notes') {
            if (notesContent) {
                notesContent.style.display = 'block';
                renderNotes();
            }
            pageTitle.innerText = 'Notes';
        } else if (target === 'Attendance') {
            if (attendanceContent) {
                attendanceContent.style.display = 'block';
                if (!canManageAttendance) {
                    document.getElementById('attendance-controls').style.display = 'none';
                } else {
                    document.getElementById('attendance-controls').style.display = 'flex';
                    fetchUsersForAttendance();
                }
                renderAttendanceTable();
            }
            pageTitle.innerText = 'Attendance';
        } else {
            mainContent.style.display = 'flex';
            pageTitle.innerText = target;

            if (target === 'Dashboard') {
                if (dashboardWrapper) dashboardWrapper.style.display = 'flex';
                updateDashboard(); 
            } else {
                if (genericContent) genericContent.style.display = 'block';
            }
        }
    });
});

const umNavItems = document.querySelectorAll('.um-nav-item');
const umTabContents = document.querySelectorAll('.um-tab-content');

umNavItems.forEach(item => {
    item.addEventListener('click', () => {
        umNavItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        const target = item.getAttribute('data-um-target');
        sessionStorage.setItem('activeUMTab', target);
        
        umTabContents.forEach(tc => tc.style.display = 'none');

        if (target === 'Team Members') {
            document.getElementById('editUsername').value = ''; 
            document.getElementById('pwdUsername').value = '';
            document.getElementById('um-view-teammembers').style.display = 'block';
            loadTeamMembers();
        } else if (target === 'Approval') {
            document.getElementById('um-view-approval').style.display = 'block';
            loadPendingApprovals();
        } else if (target === 'Profile') {
            document.getElementById('um-view-profile').style.display = 'block';
            loadProfileUploadView();
        } else if (target === 'Data') {
            document.getElementById('um-view-data').style.display = 'block';
            if (!document.getElementById('editUsername').value) {
                loadUserData(sessionStorage.getItem('activeUser'));
            }
        } else if (target === 'Password') {
            document.getElementById('um-view-password').style.display = 'block';
            if (!document.getElementById('pwdUsername').value) {
                document.getElementById('pwdUsername').value = document.getElementById('editUsername').value || sessionStorage.getItem('activeUser');
            }
        } else if (target === 'Company Details') {
            document.getElementById('um-view-companydetails').style.display = 'block';
        } else if (target === 'Rules') {
            document.getElementById('um-view-rules').style.display = 'block';
        } else {
             document.getElementById('um-view-placeholder').style.display = 'block';
             document.querySelector('#um-view-placeholder h2').textContent = target || 'Content';
        }
    });
});

let base64ProfileImage = "";

async function loadProfileUploadView() {
    try {
        const response = await fetch('http://localhost:8080/api/users/all');
        const users = await response.json();
        const user = users.find(u => u.username === sessionStorage.getItem('activeUser'));
        if (user && user.profilePicture) {
            document.getElementById('profileImagePreview').src = user.profilePicture;
            base64ProfileImage = user.profilePicture;
        } else {
            document.getElementById('profileImagePreview').src = 'Images/placeholder.png';
            base64ProfileImage = "";
        }
    } catch(e) { console.error(e); }
}

document.getElementById('profileImageInput').addEventListener('change', async function(e) {
    const file = e.target.files[0];
    if (file) {
        if (file.size > 1048576) { 
            await customAlert("File is too large! Please upload an image smaller than 1MB.");
            this.value = ""; 
            return;
        }
        const reader = new FileReader();
        reader.onload = function(event) {
            base64ProfileImage = event.target.result;
            document.getElementById('profileImagePreview').src = base64ProfileImage;
        };
        reader.readAsDataURL(file);
    }
});

document.getElementById('profileUploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!base64ProfileImage || base64ProfileImage === 'Images/placeholder.png') {
        await customAlert("Please select a new image first.");
        return;
    }

    const username = sessionStorage.getItem('activeUser');
    try {
        const response = await fetch(`http://localhost:8080/api/users/update/${username}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ profilePicture: base64ProfileImage })
        });
        const result = await response.json();
        if(result.success) {
            updateTopNavProfilePic();
        } else {
            await customAlert(result.message);
        }
    } catch (e) { console.error(e); }
});

async function loadTeamMembers() {
    try {
        const response = await fetch('http://localhost:8080/api/users/all');
        if (!response.ok) throw new Error('Network error');
        const users = await response.json();
        const tbody = document.getElementById('teamMembersTableBody');
        tbody.innerHTML = '';
        
        const currentUser = sessionStorage.getItem('activeUser');

        users.forEach((user, index) => {
            const isSelf = currentUser === user.username;
            const isAdmin = currentUser === 'Admin';
            
            const showSettings = isAdmin || isSelf;
            const showDelete = isAdmin && !isSelf; 

            let displayRole = user.role || 'Storekeeper / Stock Clerk'; 
            if (user.username === 'Admin') {
                displayRole = 'Inventory Manager';
            }
            
            const fName = (user.fullName && user.fullName !== 'N/A' && user.fullName !== 'undefined') ? user.fullName : (user.username || 'Unknown');
            
            const isPending = user.status === 'UNVERIFIED';
            const statusColor = isPending ? '#ffa500' : '#006400';
            const statusText = isPending ? 'Unverified' : 'Verified';
            
            const savedDate = user.dateCreated || 'Unknown';
            const profilePicSrc = user.profilePicture || 'Images/placeholder.png';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="color: #999; text-align: center;">${index + 1}</td>
                <td>
                    <div class="user-cell">
                        <img src="${profilePicSrc}" alt="User" class="user-avatar">
                        <div class="user-info">
                            <span class="full-name">${fName}</span>
                        </div>
                    </div>
                </td>
                <td style="color: #888;">${savedDate}</td>
                <td style="color: #888;">${displayRole}</td>
                <td style="color: #888;">
                    <span class="status-dot" style="background-color: ${statusColor};"></span> ${statusText}
                </td>
                <td>
                    ${showSettings || showDelete ? `
                        <div class="action-icons">
                            ${showSettings ? `<button class="icon-btn icon-settings" onclick="loadUserData('${user.username || ''}')">⚙️</button>` : ''}
                            ${showDelete ? `<button class="icon-btn icon-delete" onclick="kickUser('${user.username || ''}')">✖</button>` : ''}
                        </div>
                    ` : `<span style="color: #ccc; font-size: 12px;">View Only</span>`}
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (e) { console.error('Error:', e); }
}

async function loadPendingApprovals() {
    try {
        const response = await fetch('http://localhost:8080/api/users/pending');
        if (!response.ok) throw new Error('Network error');
        const users = await response.json();
        const list = document.getElementById('approvalList');
        list.innerHTML = '';
        
        if (sessionStorage.getItem('activeUser') !== 'Admin') {
            list.innerHTML = '<p style="color:red;">Only the Admin account can approve new users.</p>';
            return;
        }

        if (users.length === 0) {
            list.innerHTML = '<p>No pending approvals.</p>';
            return;
        }
        
        users.forEach(user => {
            const item = `<div class="approval-item">
                <span><strong>${user.username || 'Unknown'}</strong> (Role: ${user.role || 'Storekeeper / Stock Clerk'})</span>
                <div class="approval-actions">
                    <button class="btn-approve" onclick="approveUser('${user.username || ''}')">Approve</button>
                    <button class="btn-decline" onclick="declineUser('${user.username || ''}')">Decline</button>
                </div>
            </div>`;
            list.innerHTML += item;
        });
    } catch (e) { console.error('Error:', e); }
}

async function approveUser(username) {
    if(sessionStorage.getItem('activeUser') !== 'Admin') return;
    try {
        await fetch(`http://localhost:8080/api/users/approve/${username}`, { method: 'POST' });
        loadPendingApprovals();
        loadTeamMembers();
    } catch (e) { console.error(e); }
}

async function declineUser(username) {
    if(sessionStorage.getItem('activeUser') !== 'Admin') return;
    const confirmDecline = await customConfirm(`Are you sure you want to decline and delete the request for ${username}?`);
    
    if (confirmDecline) {
        try {
            const response = await fetch(`http://localhost:8080/api/users/delete/${username}`, {
                method: 'DELETE'
            });
            const result = await response.json();

            if (result.success) {
                loadPendingApprovals();
                loadTeamMembers();
            } else {
                await customAlert(result.message);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }
}

window.loadUserData = async function(username) {
    document.getElementById('editUsername').value = username; 
    document.getElementById('pwdUsername').value = username;
    document.querySelector('.um-nav-item[data-um-target="Data"]').click();
    try {
         const response = await fetch('http://localhost:8080/api/users/all');
         const users = await response.json();
         const user = users.find(u => u.username === username);
         
         if(user) {
             document.getElementById('editUsername').value = user.username || '';
             document.getElementById('editAccountName').value = user.username || '';
             document.getElementById('editFullName').value = (user.fullName && user.fullName !== 'N/A' && user.fullName !== 'undefined') ? user.fullName : '';
             document.getElementById('editGender').value = (user.gender && user.gender !== 'N/A' && user.gender !== 'undefined') ? user.gender : 'Male';
             document.getElementById('editAddress').value = (user.address && user.address !== 'N/A' && user.address !== 'undefined') ? user.address : '';
             document.getElementById('editEmail').value = (user.email && user.email !== 'N/A' && user.email !== 'undefined') ? user.email : '';
             document.getElementById('editPhone').value = (user.phoneNumber && user.phoneNumber !== 'N/A' && user.phoneNumber !== 'undefined') ? user.phoneNumber : '';
             
             const roleSelect = document.getElementById('editRole');
             roleSelect.value = user.role || 'Storekeeper / Stock Clerk';
             
             if (sessionStorage.getItem('activeUser') === 'Admin') {
                 roleSelect.disabled = false;
             } else {
                 roleSelect.disabled = true;
             }
         }
    } catch(e) { console.error(e); }
}

document.getElementById('userDataForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('editUsername').value;
    if(!username) return;

    const updates = {
        fullName: document.getElementById('editFullName').value,
        gender: document.getElementById('editGender').value,
        address: document.getElementById('editAddress').value,
        email: document.getElementById('editEmail').value,
        phoneNumber: document.getElementById('editPhone').value,
        role: document.getElementById('editRole').value
    };

    try {
        const response = await fetch(`http://localhost:8080/api/users/update/${username}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        const result = await response.json();
        if(result.success) {
            document.querySelector('.um-nav-item[data-um-target="Team Members"]').click();
        }
    } catch (e) { console.error(e); }
});

document.getElementById('btn-update-password').addEventListener('click', async () => {
    const username = document.getElementById('pwdUsername').value || sessionStorage.getItem('activeUser');
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const retypePassword = document.getElementById('retypePassword').value;

    if (!currentPassword || !newPassword || !retypePassword) {
        await customAlert("Please fill all fields.");
        return;
    }

    if (newPassword !== retypePassword) {
        await customAlert("New passwords do not match!");
        return;
    }

    try {
        const response = await fetch(`http://localhost:8080/api/users/change-password/${username}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentPassword: currentPassword, newPassword: newPassword })
        });
        const result = await response.json();
        
        await customAlert(result.message);
        if(result.success) {
            document.getElementById('passwordForm').reset();
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('retypePassword').value = '';
        }
    } catch (e) { console.error(e); }
});

async function kickUser(username) {
    if (!username) return;
    if (username.toLowerCase() === 'admin') {
        await customAlert("You cannot delete the main Admin account!");
        return;
    }

    const confirmDelete = await customConfirm("Are you sure you want to delete his/her account?");
    
    if (confirmDelete) {
        try {
            const response = await fetch(`http://localhost:8080/api/users/delete/${username}`, {
                method: 'DELETE'
            });
            const result = await response.json();

            if (result.success) {
                await customAlert(result.message || "Account successfully deleted.");
                loadTeamMembers(); 
            } else {
                await customAlert(result.message || "Failed to delete account.");
            }
        } catch (error) {
            console.error('Error:', error);
            await customAlert('Failed to delete account. Check if the server is running.');
        }
    }
}

let products = JSON.parse(localStorage.getItem('ims_products')) || [];
let selectedProductId = null;
let lastClickTime = 0;
let lastClickedId = null;
let consecutiveClicks = 0;
let quickAdjustProductId = null;
let productBase64Image = "";
let scannerInstance = null;
let scannedCart = {};

if (userRole === 'Inventory Manager' || userRole === 'Inventory Analyst') {
    const btnClearSales = document.getElementById('btn-clear-sales');
    if (btnClearSales) btnClearSales.style.display = 'block';
}

const btnClearSales = document.getElementById('btn-clear-sales');
if (btnClearSales) {
    btnClearSales.addEventListener('click', async () => {
        const confirmed = await customConfirm("Are you sure you want to clear all sales records?");
        if (confirmed) {
            salesHistory = [];
            localStorage.setItem('ims_sales_history', JSON.stringify(salesHistory));
            renderSalesReports();
            updateDashboard();
            await customAlert("Sales report cleared.");
        }
    });
}

window.deleteSaleRecord = async function(index) {
    const confirmed = await customConfirm("Are you sure you want to delete this record?");
    if (confirmed) {
        salesHistory.splice(index, 1);
        localStorage.setItem('ims_sales_history', JSON.stringify(salesHistory));
        renderSalesReports();
        updateDashboard();
    }
}

window.deleteFeedbackRecord = async function(id) {
    const confirmed = await customConfirm("Delete this feedback?");
    if (confirmed) {
        feedbackHistory = feedbackHistory.filter(f => f.id !== id);
        localStorage.setItem('ims_feedback_history', JSON.stringify(feedbackHistory));
        renderSalesReports();
    }
}

function saveProducts() {
    localStorage.setItem('ims_products', JSON.stringify(products));
    renderProducts();
    if (sessionStorage.getItem('activeTab') === 'Dashboard' || !sessionStorage.getItem('activeTab')) {
        updateDashboard();
    }
}

function generateRandomSKU() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function updateProductImagePreview(product) {
    const imgElement = document.getElementById('selected-product-image');
    const nameContainer = document.getElementById('selected-product-name-container');
    const nameElement = document.getElementById('selected-product-name');

    if (product) {
        if (product.image) {
            imgElement.src = product.image;
        } else {
            imgElement.src = 'Images/placeholder.png';
        }
        
        if (nameContainer && nameElement) {
            if (!canEditProducts) {
                nameContainer.style.display = 'flex';
                nameElement.textContent = product.name;
            } else {
                nameContainer.style.display = 'none';
            }
        }
    } else {
        imgElement.src = 'Images/placeholder.png';
        if (nameElement) {
            nameElement.textContent = '';
        }
    }
}

if (document.getElementById('pl-search-input')) {
    document.getElementById('pl-search-input').addEventListener('input', renderProducts);
}

function renderProducts() {
    const tbody = document.getElementById('productTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (selectedProductId && !products.find(p => p.id === selectedProductId)) {
        selectedProductId = null;
    }
    
    const selectedProduct = products.find(p => p.id === selectedProductId);
    updateProductImagePreview(selectedProduct);

    let totalProducts = products.length;
    let totalPrices = 0;
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;
    let totalValue = 0;

    const searchTerm = (document.getElementById('pl-search-input')?.value || '').toLowerCase();

    let filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm) || 
        p.sku.toLowerCase().includes(searchTerm)
    );

    filteredProducts.forEach((p, index) => {
        const stock = parseInt(p.stock);
        const alertLevel = parseInt(p.alert);
        const price = parseFloat(p.price);
        const itemTotal = stock * price;

        totalPrices += price;
        totalValue += itemTotal;

        let status = '';
        let statusClass = '';
        
        if (stock === 0) {
            status = 'Out of Stock';
            statusClass = 'status-out-stock';
            outOfStock++;
        } else if (stock <= alertLevel) {
            status = 'Low Stock';
            statusClass = 'status-low-stock';
            lowStock++;
        } else {
            status = 'In Stock';
            statusClass = 'status-in-stock';
            inStock++;
        }

        const tr = document.createElement('tr');
        if (p.id === selectedProductId) {
            tr.classList.add('selected-row');
        }

        tr.addEventListener('click', (e) => {
            const currentTime = new Date().getTime();
            if (lastClickedId === p.id && (currentTime - lastClickTime) < 400) {
                consecutiveClicks++;
            } else {
                consecutiveClicks = 1;
            }
            lastClickedId = p.id;
            lastClickTime = currentTime;

            if (selectedProductId === p.id && consecutiveClicks === 1) {
                selectedProductId = null;
                tr.classList.remove('selected-row');
                updateProductImagePreview(null);
            } else if (selectedProductId !== p.id) {
                selectedProductId = p.id;
                document.querySelectorAll('#productTableBody tr').forEach(r => r.classList.remove('selected-row'));
                tr.classList.add('selected-row');
                updateProductImagePreview(p);
            }

            if (consecutiveClicks === 3) {
                if (canEditProducts) {
                    openQuickAdjust(p.id);
                } else {
                    customAlert("You do not have permission to adjust stock.");
                }
                consecutiveClicks = 0;
            }
        });

        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${p.name}</td>
            <td class="sku-cell" onclick="handleCellClick(event, '${p.sku}')">${p.sku}</td>
            <td class="qr-code-cell" onclick="handleCellClick(event, '${p.sku}')"><div style="background:white; padding:2px; border-radius:4px; display:inline-flex; align-items:center; justify-content:center;"><svg id="barcode-${p.id}" style="width: 100px; height: 30px;"></svg></div></td>
            <td>₱${price.toFixed(2)}</td>
            <td>${stock}</td>
            <td>${alertLevel}</td>
            <td class="${statusClass}">${status}</td>
            <td>${p.exp ? p.exp : 'N/A'}</td>
            <td>₱${itemTotal.toFixed(2)}</td>
        `;
        tbody.appendChild(tr);

        setTimeout(() => {
            const barcodeSvg = document.getElementById(`barcode-${p.id}`);
            if(barcodeSvg) {
                JsBarcode(barcodeSvg, p.sku, {
                    format: "CODE128",
                    width: 1.5,
                    height: 40,
                    displayValue: false,
                    margin: 0,
                    background: "transparent",
                    lineColor: "#000000"
                });
            }
        }, 10);
    });

    document.getElementById('st-total').textContent = totalProducts;
    document.getElementById('st-avg').textContent = totalProducts > 0 ? `₱${(totalPrices / totalProducts).toFixed(2)}` : '₱0.00';
    document.getElementById('st-in').textContent = inStock;
    document.getElementById('st-low').textContent = lowStock;
    document.getElementById('st-out').textContent = outOfStock;
    document.getElementById('st-value').textContent = `₱${totalValue.toFixed(2)}`;
}

window.handleCellClick = function(event, sku) {
    event.stopPropagation();
    
    document.getElementById('large-qr-container').innerHTML = '<svg id="large-barcode-svg"></svg>';
    
    JsBarcode("#large-barcode-svg", sku, {
        format: "CODE128",
        width: 3,
        height: 100,
        displayValue: true,
        background: "#ffffff",
        lineColor: "#000000",
        margin: 10
    });
    
    document.getElementById('large-qr-sku').textContent = ""; 
    
    const overlay = document.getElementById('qrDisplayModalOverlay');
    overlay.classList.remove('hiding');
    overlay.classList.add('active');
};

document.getElementById('btn-close-qr-display').addEventListener('click', () => {
    const overlay = document.getElementById('qrDisplayModalOverlay');
    overlay.classList.add('hiding');
    setTimeout(() => {
        overlay.classList.remove('active');
        overlay.classList.remove('hiding');
    }, 300);
});

window.viewReceipt = function(receiptId) {
    const receipt = receiptHistory.find(r => r.id === receiptId);
    if (receipt) {
        document.getElementById('receipt-view-content').innerHTML = receipt.htmlContent;
        const overlay = document.getElementById('receiptViewModalOverlay');
        overlay.classList.remove('hiding');
        overlay.classList.add('active');
    }
}

document.getElementById('btn-close-receipt-view').addEventListener('click', () => {
    const overlay = document.getElementById('receiptViewModalOverlay');
    overlay.classList.add('hiding');
    setTimeout(() => {
        overlay.classList.remove('active');
        overlay.classList.remove('hiding');
    }, 300);
});

function renderSalesReports() {
    const tbodyOut = document.getElementById('salesTableBodyOut');
    const tbodyIn = document.getElementById('salesTableBodyIn');
    const fbContainer = document.getElementById('feedbackBoxContainer');
    
    if (!tbodyOut || !tbodyIn) return;
    
    tbodyOut.innerHTML = '';
    tbodyIn.innerHTML = '';
    if (fbContainer) fbContainer.innerHTML = '';
    
    const reversedHistory = [...salesHistory].reverse();
    const reversedFeedback = [...feedbackHistory].reverse();
    
    let outCount = 0;
    let inCount = 0;

    reversedHistory.forEach((record, index) => {
        const originalIndex = salesHistory.length - 1 - index;
        const tr = document.createElement('tr');
        const type = record.type || 'OUT'; 
        
        let actionHtml = '';
        
        if (type === 'OUT') {
            if (record.receiptId) {
                actionHtml += `<button class="btn-view-receipt" onclick="viewReceipt('${record.receiptId}')">View</button> `;
            } else {
                actionHtml += `<span style="color:#999; font-size:12px;">N/A</span> `;
            }
        }
        
        if (userRole === 'Inventory Manager' || userRole === 'Inventory Analyst' || activeUser === 'Admin') {
            actionHtml += `<button class="btn-delete-sale" onclick="deleteSaleRecord(${originalIndex})">✖</button>`;
        }

        if (type === 'OUT') {
            tr.innerHTML = `
                <td>${record.date}</td>
                <td>${record.user}</td>
                <td>${record.name}</td>
                <td>${record.sku}</td>
                <td style="color: #d9534f; font-weight: bold;">-${record.qty}</td>
                <td>₱${record.total}</td>
                <td>${actionHtml}</td>
            `;
            tbodyOut.appendChild(tr);
            outCount++;
        } else if (type === 'IN') {
            tr.innerHTML = `
                <td>${record.date}</td>
                <td>${record.user}</td>
                <td>${record.name}</td>
                <td>${record.sku}</td>
                <td style="color: #28a745; font-weight: bold;">+${record.qty}</td>
                <td>${actionHtml}</td>
            `;
            tbodyIn.appendChild(tr);
            inCount++;
        }
    });
    
    if (fbContainer) {
        reversedFeedback.forEach(fb => {
            const card = document.createElement('div');
            card.className = 'feedback-box-card';
            
            let actionHtml = '';
            if (userRole === 'Inventory Manager' || userRole === 'Inventory Analyst' || activeUser === 'Admin') {
                actionHtml = `<button class="btn-delete-fb" onclick="deleteFeedbackRecord(${fb.id})">✖</button>`;
            }
            
            const stars = '★'.repeat(fb.rating) + '☆'.repeat(5 - fb.rating);
            
            card.innerHTML = `
                <div class="fb-header">
                    <span class="fb-name">${fb.name}</span>
                    <span class="fb-date">${fb.date}</span>
                </div>
                <div class="fb-stars">${stars}</div>
                <div class="fb-message">${fb.message}</div>
                ${actionHtml}
            `;
            fbContainer.appendChild(card);
        });
        
        if (reversedFeedback.length === 0) {
            fbContainer.innerHTML = '<p style="text-align: center; color: #777; padding: 20px;">No feedback recorded.</p>';
        }
    }

    if (outCount === 0) tbodyOut.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px; color: #777;">No deductions recorded.</td></tr>';
    if (inCount === 0) tbodyIn.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #777;">No restocks recorded.</td></tr>';
}

function adjustStockAmount(val) {
    if (!quickAdjustProductId) return;
    const p = products.find(x => x.id === quickAdjustProductId);
    if (!p) return;

    let oldStock = parseInt(p.stock);
    let newStock = oldStock + val;
    if (newStock < 0) newStock = 0; 
    
    let actualDiff = newStock - oldStock;
    
    if (actualDiff !== 0) {
        p.stock = newStock.toString();
        document.getElementById('quickAdjustCurrentStock').textContent = p.stock;
        
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-US') + ' ' + now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        
        if (actualDiff > 0) {
            let win = parseInt(localStorage.getItem('ims_weekly_in')) || 0;
            win += actualDiff;
            localStorage.setItem('ims_weekly_in', win);
        } else {
            let wout = parseInt(localStorage.getItem('ims_weekly_out')) || 0;
            wout += Math.abs(actualDiff);
            localStorage.setItem('ims_weekly_out', wout);
        }

        salesHistory.push({
            date: dateStr,
            user: activeUser,
            name: p.name,
            sku: p.sku,
            qty: Math.abs(actualDiff),
            price: p.price,
            total: (parseFloat(p.price) * Math.abs(actualDiff)).toFixed(2),
            type: actualDiff > 0 ? 'IN' : 'OUT'
        });
        localStorage.setItem('ims_sales_history', JSON.stringify(salesHistory));
        saveProducts(); 
    }
}

function openQuickAdjust(id) {
    quickAdjustProductId = id;
    const p = products.find(x => x.id === id);
    if (!p) return;

    document.getElementById('quickAdjustProductName').textContent = p.name;
    document.getElementById('quickAdjustCurrentStock').textContent = p.stock;
    document.getElementById('qa-custom-val').value = '';
    
    const overlay = document.getElementById('quickAdjustModalOverlay');
    overlay.classList.remove('hiding');
    overlay.classList.add('active');
    
    setTimeout(() => {
        document.getElementById('qa-custom-val').focus();
    }, 50);
}

document.getElementById('qa-custom-minus').addEventListener('click', () => {
    const val = parseInt(document.getElementById('qa-custom-val').value);
    if (!isNaN(val) && val > 0) {
        adjustStockAmount(-val);
        document.getElementById('qa-custom-val').value = '';
        document.getElementById('qa-custom-val').focus();
    }
});

document.getElementById('qa-custom-plus').addEventListener('click', () => {
    const val = parseInt(document.getElementById('qa-custom-val').value);
    if (!isNaN(val) && val > 0) {
        adjustStockAmount(val);
        document.getElementById('qa-custom-val').value = '';
        document.getElementById('qa-custom-val').focus();
    }
});

document.getElementById('qa-custom-val').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        const val = parseInt(document.getElementById('qa-custom-val').value);
        if (!isNaN(val) && val > 0) {
            adjustStockAmount(val);
            document.getElementById('qa-custom-val').value = '';
        }
    }
});

document.getElementById('btn-close-quick-adjust').addEventListener('click', () => {
    const overlay = document.getElementById('quickAdjustModalOverlay');
    overlay.classList.add('hiding');
    setTimeout(() => {
        overlay.classList.remove('active');
        overlay.classList.remove('hiding');
        quickAdjustProductId = null;
    }, 300);
});

document.getElementById('prodImageInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            productBase64Image = event.target.result;
            document.getElementById('prodImagePreview').src = productBase64Image;
            document.getElementById('prodDataBase64').value = productBase64Image;
        };
        reader.readAsDataURL(file);
    }
});

document.getElementById('btn-add-product').addEventListener('click', () => {
    document.getElementById('productForm').reset();
    document.getElementById('prodId').value = '';
    document.getElementById('prodSku').value = generateRandomSKU();
    document.getElementById('prodImagePreview').src = 'Images/placeholder.png';
    document.getElementById('prodDataBase64').value = '';
    productBase64Image = "";
    document.getElementById('productModalTitle').textContent = 'Add Product';
    
    const overlay = document.getElementById('productModalOverlay');
    overlay.classList.remove('hiding');
    overlay.classList.add('active');
});

document.getElementById('btn-edit-product').addEventListener('click', async () => {
    if (!selectedProductId) {
        await customAlert("Please select a product from the table first.");
        return;
    }
    
    const p = products.find(x => x.id === selectedProductId);
    if (p) {
        document.getElementById('prodId').value = p.id;
        document.getElementById('prodName').value = p.name;
        document.getElementById('prodSku').value = p.sku;
        document.getElementById('prodPrice').value = p.price;
        document.getElementById('prodStock').value = p.stock;
        document.getElementById('prodAlert').value = p.alert;
        document.getElementById('prodExp').value = p.exp || '';
        document.getElementById('prodImagePreview').src = p.image || 'Images/placeholder.png';
        document.getElementById('prodDataBase64').value = p.image || '';
        productBase64Image = p.image || "";

        document.getElementById('productModalTitle').textContent = 'Edit Product';
        const overlay = document.getElementById('productModalOverlay');
        overlay.classList.remove('hiding');
        overlay.classList.add('active');
    }
});

document.getElementById('btn-remove-product').addEventListener('click', async () => {
    if (!selectedProductId) {
        await customAlert("Please select a product from the table first.");
        return;
    }
    
    const confirmDel = await customConfirm("Are you sure you want to delete this product?");
    if (confirmDel) {
        products = products.filter(x => x.id !== selectedProductId);
        selectedProductId = null;
        updateProductImagePreview(null);
        saveProducts();
    }
});

document.getElementById('productForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const id = document.getElementById('prodId').value || Date.now().toString();
    const newProduct = {
        id: id,
        name: document.getElementById('prodName').value,
        sku: document.getElementById('prodSku').value,
        price: document.getElementById('prodPrice').value,
        stock: document.getElementById('prodStock').value,
        alert: document.getElementById('prodAlert').value,
        exp: document.getElementById('prodExp').value,
        image: document.getElementById('prodDataBase64').value
    };

    const existingIndex = products.findIndex(x => x.id === id);
    if (existingIndex > -1) {
        let oldP = products[existingIndex];
        let diff = parseInt(newProduct.stock) - parseInt(oldP.stock);
        if (diff !== 0) {
            if (diff > 0) {
                let win = parseInt(localStorage.getItem('ims_weekly_in')) || 0;
                win += diff;
                localStorage.setItem('ims_weekly_in', win);
            } else {
                let wout = parseInt(localStorage.getItem('ims_weekly_out')) || 0;
                wout += Math.abs(diff);
                localStorage.setItem('ims_weekly_out', wout);
            }

            const now = new Date();
            const dateStr = now.toLocaleDateString('en-US') + ' ' + now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
            salesHistory.push({
                date: dateStr,
                user: activeUser,
                name: newProduct.name,
                sku: newProduct.sku,
                qty: Math.abs(diff),
                price: newProduct.price,
                total: (parseFloat(newProduct.price) * Math.abs(diff)).toFixed(2),
                type: diff > 0 ? 'IN' : 'OUT'
            });
            localStorage.setItem('ims_sales_history', JSON.stringify(salesHistory));
        }
        products[existingIndex] = newProduct;
    } else {
        products.push(newProduct);
        if (parseInt(newProduct.stock) > 0) {
            let win = parseInt(localStorage.getItem('ims_weekly_in')) || 0;
            win += parseInt(newProduct.stock);
            localStorage.setItem('ims_weekly_in', win);

            const now = new Date();
            const dateStr = now.toLocaleDateString('en-US') + ' ' + now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
            salesHistory.push({
                date: dateStr,
                user: activeUser,
                name: newProduct.name,
                sku: newProduct.sku,
                qty: newProduct.stock,
                price: newProduct.price,
                total: (parseFloat(newProduct.price) * parseInt(newProduct.stock)).toFixed(2),
                type: 'IN'
            });
            localStorage.setItem('ims_sales_history', JSON.stringify(salesHistory));
        }
    }

    if (selectedProductId === id) {
        updateProductImagePreview(newProduct);
    }

    saveProducts();
    closeProductModal();
});

function closeProductModal() {
    const overlay = document.getElementById('productModalOverlay');
    overlay.classList.add('hiding');
    setTimeout(() => {
        overlay.classList.remove('active');
        overlay.classList.remove('hiding');
    }, 300);
}

document.getElementById('btn-cancel-product').addEventListener('click', closeProductModal);

document.getElementById('btn-export-pdf').addEventListener('click', () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US');
    const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    document.getElementById('print-date').textContent = `${dateStr} ${timeStr}`;
    
    const isDarkTheme = document.body.classList.contains('dark-theme');
    if (isDarkTheme) {
        document.body.classList.remove('dark-theme');
    }

    window.print();
    
    if (isDarkTheme) {
        document.body.classList.add('dark-theme');
    }
});

document.getElementById('btn-scan-qr').addEventListener('click', () => {
    scannedCart = {};
    renderScannedCart();
    document.getElementById('scanner-amount-paid').value = '';
    
    const overlay = document.getElementById('scannerModalOverlay');
    overlay.classList.remove('hiding');
    overlay.classList.add('active');

    scannerInstance = new Html5QrcodeScanner(
        "reader",
        { 
            fps: 10, 
            qrbox: { width: 450, height: 150 },
            aspectRatio: 1.5,
            formatsToSupport: [ 
                Html5QrcodeSupportedFormats.CODE_128,
                Html5QrcodeSupportedFormats.CODE_39,
                Html5QrcodeSupportedFormats.EAN_13,
                Html5QrcodeSupportedFormats.EAN_8,
                Html5QrcodeSupportedFormats.UPC_A,
                Html5QrcodeSupportedFormats.UPC_E
            ]
        },
        false
    );
    
    scannerInstance.render(onScanSuccess, onScanFailure);
});

document.getElementById('btn-close-scanner').addEventListener('click', closeScannerModal);

function closeScannerModal() {
    const overlay = document.getElementById('scannerModalOverlay');
    overlay.classList.add('hiding');
    
    setTimeout(() => {
        overlay.classList.remove('active');
        overlay.classList.remove('hiding');
        
        if (scannerInstance) {
            scannerInstance.clear().catch(e => console.log("Failed to clear scanner", e));
            scannerInstance = null;
        }
    }, 300);
}

document.getElementById('btn-manual-sku-add').addEventListener('click', () => {
    const sku = document.getElementById('manual-sku-input').value.trim();
    if(sku) {
        const p = products.find(x => x.sku === sku);
        if(p) {
            if(!scannedCart[sku]) {
                scannedCart[sku] = 1;
            } else {
                scannedCart[sku] += 1;
            }
            renderScannedCart(sku);
            document.getElementById('manual-sku-input').value = '';
        } else {
            customAlert("SKU not found.");
        }
    }
});

let lastScannedTime = 0;
let lastScannedSku = null;

function onScanSuccess(decodedText, decodedResult) {
    const scannedSku = decodedText.trim();
    const p = products.find(x => x.sku === scannedSku);
    const now = Date.now();
    
    if(p) {
        if (scannedSku === lastScannedSku && (now - lastScannedTime < 1500)) {
            return; 
        }
        lastScannedSku = scannedSku;
        lastScannedTime = now;

        try {
            let beep = new Audio('Audio/BeepSound.mp3');
            beep.play().catch(e => console.log(e));
        } catch (e) {}

        if(!scannedCart[scannedSku]) {
            scannedCart[scannedSku] = 1;
        } else {
            scannedCart[scannedSku] += 1;
        }
        renderScannedCart(scannedSku);
    }
}

function onScanFailure(error) {
}

function renderScannedCart(focusSku = null) {
    const listContainer = document.getElementById('scannedItemsList');
    listContainer.innerHTML = '';
    
    let totalItems = 0;
    let totalDue = 0;

    if(Object.keys(scannedCart).length === 0) {
        listContainer.innerHTML = '<p style="color:#777; text-align:center; margin-top:20px;">No items scanned yet.</p>';
        document.getElementById('scanned-total-items').textContent = 'Total Products: 0';
        document.getElementById('scanner-total-due').textContent = '₱0.00';
        return;
    }

    for(const [sku, qty] of Object.entries(scannedCart)) {
        const p = products.find(x => x.sku === sku);
        if(!p) continue;
        
        totalItems += qty;
        totalDue += (parseFloat(p.price) * qty);

        const row = document.createElement('div');
        row.className = 'scanned-item-row';
        row.innerHTML = `
            <div>
                <strong>${p.name}</strong><br>
                <small style="color:#666;">SKU: ${sku} | ₱${parseFloat(p.price).toFixed(2)} each</small>
            </div>
            <div class="scanned-item-qty">
                <input type="number" value="${qty}" min="1" data-sku="${sku}" class="cart-qty-input">
                <button class="btn-remove-scan" data-sku="${sku}">✖</button>
            </div>
        `;
        listContainer.appendChild(row);
    }

    document.getElementById('scanned-total-items').textContent = `Total Products: ${totalItems}`;
    document.getElementById('scanner-total-due').textContent = `₱${totalDue.toFixed(2)}`;
    
    document.querySelectorAll('.cart-qty-input').forEach(input => {
        input.addEventListener('change', function() {
            const sku = this.getAttribute('data-sku');
            const newQty = parseInt(this.value);
            if(newQty > 0) {
                scannedCart[sku] = newQty;
            } else {
                this.value = 1;
                scannedCart[sku] = 1;
            }
            renderScannedCart(); 
        });
    });

    document.querySelectorAll('.btn-remove-scan').forEach(btn => {
        btn.addEventListener('click', function() {
            const sku = this.getAttribute('data-sku');
            delete scannedCart[sku];
            renderScannedCart();
        });
    });

    if (focusSku) {
        const targetInput = document.querySelector(`.cart-qty-input[data-sku="${focusSku}"]`);
        if (targetInput) {
            targetInput.focus();
            targetInput.select();
        }
    }
}

document.getElementById('btn-process-checkout').addEventListener('click', async () => {
    if(Object.keys(scannedCart).length === 0) {
        await customAlert("Bought list is empty!");
        return;
    }

    let totalDue = 0;
    let totalItemsDeducted = 0;
    for(const [sku, qty] of Object.entries(scannedCart)) {
        const p = products.find(x => x.sku === sku);
        if(p) {
            totalDue += (parseFloat(p.price) * qty);
            totalItemsDeducted += qty;
        }
    }

    const amountPaidInput = document.getElementById('scanner-amount-paid').value;
    const amountPaid = parseFloat(amountPaidInput);

    if (isNaN(amountPaid) || amountPaid < totalDue) {
        await customAlert(`Insufficient payment. Total due is ₱${totalDue.toFixed(2)}`);
        return;
    }

    const change = amountPaid - totalDue;
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US') + ' ' + now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const receiptId = 'REC-' + Date.now();

    let ct = parseInt(localStorage.getItem('ims_customers_today')) || 0;
    ct++;
    localStorage.setItem('ims_customers_today', ct);

    let wout = parseInt(localStorage.getItem('ims_weekly_out')) || 0;
    wout += totalItemsDeducted;
    localStorage.setItem('ims_weekly_out', wout);

    let receiptContentHtml = `
<div style="text-align:center; margin-bottom:15px;">
    <strong>Natnat's Inventory Management System</strong><br>
    <small>${dateStr}</small><br>
    <small>Receipt ID: ${receiptId}</small><br>
    <small>Cashier: ${activeUser}</small>
</div>
<hr style="border:1px dashed #ccc; margin-bottom:10px;">
<table style="width:100%; font-size:14px; text-align:left;">
    <tr><th>Qty</th><th>Item</th><th style="text-align:right;">Total</th></tr>`;

    for(const [sku, qty] of Object.entries(scannedCart)) {
        const p = products.find(x => x.sku === sku);
        if(p) {
            let newStock = parseInt(p.stock) - qty;
            if(newStock < 0) newStock = 0;
            p.stock = newStock.toString();

            const lineTotal = parseFloat(p.price) * qty;

            receiptContentHtml += `<tr><td>${qty}</td><td>${p.name}</td><td style="text-align:right;">₱${lineTotal.toFixed(2)}</td></tr>`;

            salesHistory.push({
                date: dateStr,
                user: activeUser,
                name: p.name,
                sku: p.sku,
                qty: qty,
                price: p.price,
                total: lineTotal.toFixed(2),
                type: 'OUT',
                receiptId: receiptId 
            });
        }
    }

    receiptContentHtml += `</table>
<hr style="border:1px dashed #ccc; margin-top:10px; margin-bottom:10px;">
<div style="display:flex; justify-content:space-between; font-weight:bold; font-size:16px;">
    <span>Total Due:</span><span>₱${totalDue.toFixed(2)}</span>
</div>
<div style="display:flex; justify-content:space-between;">
    <span>Cash Paid:</span><span>₱${amountPaid.toFixed(2)}</span>
</div>
<div style="display:flex; justify-content:space-between;">
    <span>Change:</span><span>₱${change.toFixed(2)}</span>
</div>
<div style="text-align:center; margin-top:20px; font-weight:bold;">
    Thank you!
</div>`;

    receiptHistory.push({
        id: receiptId,
        htmlContent: receiptContentHtml
    });
    localStorage.setItem('ims_receipt_history', JSON.stringify(receiptHistory));
    localStorage.setItem('ims_sales_history', JSON.stringify(salesHistory));
    saveProducts();
    
    closeScannerModal();

    document.getElementById('receipt-content').innerHTML = receiptContentHtml;
    const receiptOverlay = document.getElementById('receiptModalOverlay');
    receiptOverlay.classList.remove('hiding');
    receiptOverlay.classList.add('active');
});

document.getElementById('btn-close-receipt').addEventListener('click', () => {
    const overlay = document.getElementById('receiptModalOverlay');
    overlay.classList.add('hiding');
    setTimeout(() => {
        overlay.classList.remove('active');
        overlay.classList.remove('hiding');
    }, 300);
});

if (document.getElementById('btn-reset-data')) {
    document.getElementById('btn-reset-data').addEventListener('click', async () => {
        const confirmed = await customConfirm("Are you sure you want to reset ALL data? This cannot be undone.");
        if (confirmed) {
            document.getElementById('reset-confirm-input').value = '';
            const overlay = document.getElementById('resetDataModalOverlay');
            overlay.classList.remove('hiding');
            overlay.classList.add('active');
            setTimeout(() => { document.getElementById('reset-confirm-input').focus(); }, 50);
        }
    });
}

document.getElementById('btn-cancel-reset').addEventListener('click', () => {
    const overlay = document.getElementById('resetDataModalOverlay');
    overlay.classList.add('hiding');
    setTimeout(() => {
        overlay.classList.remove('active');
        overlay.classList.remove('hiding');
    }, 300);
});

document.getElementById('btn-confirm-reset').addEventListener('click', async () => {
    const inputVal = document.getElementById('reset-confirm-input').value;
    if (inputVal === 'RESET DATA ACTIVATE') {
        products = [];
        salesHistory = [];
        receiptHistory = [];
        notesHistory = [];
        attendanceHistory = [];
        feedbackHistory = [];
        localStorage.setItem('ims_products', JSON.stringify(products));
        localStorage.setItem('ims_sales_history', JSON.stringify(salesHistory));
        localStorage.setItem('ims_receipt_history', JSON.stringify(receiptHistory));
        localStorage.setItem('ims_notes_history', JSON.stringify(notesHistory));
        localStorage.setItem('ims_attendance_history', JSON.stringify(attendanceHistory));
        localStorage.setItem('ims_feedback_history', JSON.stringify(feedbackHistory));
        localStorage.setItem('ims_weekly_in', '0');
        localStorage.setItem('ims_weekly_out', '0');
        localStorage.setItem('ims_customers_today', '0');
        
        renderProducts();
        renderSalesReports();
        updateDashboard();
        renderNotes();
        renderAttendanceTable();

        const overlay = document.getElementById('resetDataModalOverlay');
        overlay.classList.add('hiding');
        setTimeout(() => {
            overlay.classList.remove('active');
            overlay.classList.remove('hiding');
        }, 300);

        await customAlert("All data has been successfully reset.");
    } else {
        await customAlert("Incorrect confirmation text.");
    }
});

function updateDashboard() {
    let totalQty = 0;
    let stockValue = 0;
    let lowStockCount = 0;
    let reorderSkus = 0;

    products.forEach(p => {
        const stock = parseInt(p.stock) || 0;
        const price = parseFloat(p.price) || 0;
        const alertLevel = parseInt(p.alert) || 0;

        totalQty += stock;
        stockValue += stock * price;

        if (stock <= alertLevel && stock > 0) {
            lowStockCount++;
        }
        if (stock === 0) {
            reorderSkus++;
        }
    });

    let receiveIn = 0;
    let ordersOut = 0;
    let salesToday = 0;

    let stocksInWeekly = parseInt(localStorage.getItem('ims_weekly_in')) || 0;
    let stocksOutWeekly = parseInt(localStorage.getItem('ims_weekly_out')) || 0;
    let customersToday = parseInt(localStorage.getItem('ims_customers_today')) || 0;

    const todayStr = new Date().toLocaleDateString('en-US');
    const productSales = {};

    const last7Days = [];
    const salesByDay = {};
    for (let i = 6; i >= 0; i--) {
        let d = new Date();
        d.setDate(d.getDate() - i);
        let dStr = d.toLocaleDateString('en-US');
        last7Days.push(dStr);
        salesByDay[dStr] = 0;
    }

    salesHistory.forEach(r => {
        const rDateParts = r.date.split(' ');
        const rDate = rDateParts[0]; 
        const qty = parseInt(r.qty) || 0;
        const total = parseFloat(r.total) || 0;

        if (r.type === 'IN') {
            receiveIn += total;
        } else if (r.type === 'OUT') {
            const rYear = new Date(r.date).getFullYear();
            
            if (rYear === selectedDashboardYear) {
                ordersOut += total;

                if (rDate === todayStr && selectedDashboardYear === currentSystemYear) {
                    salesToday += total;
                }

                if (salesByDay[rDate] !== undefined) {
                    salesByDay[rDate] += total;
                }

                if (!productSales[r.sku]) {
                    productSales[r.sku] = { name: r.name, qty: 0, total: 0 };
                }
                productSales[r.sku].qty += qty;
                productSales[r.sku].total += total;
            }
        }
    });

    let avgNetProfit = products.length > 0 ? ordersOut / products.length : 0;

    const elTotalQty = document.getElementById('dash-available-qty');
    const elReorder = document.getElementById('dash-reorder-skus');
    const elStockVal = document.getElementById('dash-stock-value');
    const elAvgProfit = document.getElementById('dash-avg-net-profit');
    const elReceive = document.getElementById('dash-receive-in');
    const elOrders = document.getElementById('dash-orders-out');
    const elIn = document.getElementById('dash-stocks-in');
    const elOut = document.getElementById('dash-stocks-out');
    const elLow = document.getElementById('dash-low-stocks');
    const elToday = document.getElementById('dash-sales-today');
    const elCust = document.getElementById('dash-customers-today');
    const elProd = document.getElementById('dash-total-products');

    if (elTotalQty) elTotalQty.textContent = totalQty;
    if (elReorder) elReorder.textContent = reorderSkus;
    if (elStockVal) elStockVal.textContent = `₱${stockValue.toFixed(2)}`;
    if (elAvgProfit) elAvgProfit.textContent = `₱${avgNetProfit.toFixed(2)}`;
    if (elReceive) elReceive.textContent = `₱${receiveIn.toFixed(2)}`;
    if (elOrders) elOrders.textContent = `₱${ordersOut.toFixed(2)}`;
    if (elIn) elIn.textContent = stocksInWeekly;
    if (elOut) elOut.textContent = stocksOutWeekly;
    if (elLow) elLow.textContent = lowStockCount;
    if (elToday) elToday.textContent = selectedDashboardYear === currentSystemYear ? `₱${salesToday.toFixed(2)}` : '₱0.00';
    if (elCust) elCust.textContent = customersToday;
    if (elProd) elProd.textContent = products.length;

    const sortedProducts = Object.values(productSales).sort((a, b) => b.qty - a.qty).slice(0, 5);
    
    const topBody = document.getElementById('topProductsBody');
    if(topBody) {
        topBody.innerHTML = '';
        if (sortedProducts.length === 0) {
            topBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px; color: #777;">No sales data available.</td></tr>';
        } else {
            sortedProducts.forEach((p, index) => {
                topBody.innerHTML += `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${p.name}</td>
                        <td>${p.qty}</td>
                        <td>₱${p.total.toFixed(2)}</td>
                    </tr>
                `;
            });
        }
    }

    const monthlySales = new Array(12).fill(0);
    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    salesHistory.forEach(r => {
        if(r.type === 'OUT') {
            const rDate = new Date(r.date);
            if(rDate.getFullYear() === selectedDashboardYear) {
                monthlySales[rDate.getMonth()] += parseFloat(r.total) || 0;
            }
        }
    });

    renderCharts(monthLabels, monthlySales, sortedProducts);

    const activityContainer = document.getElementById('pd-recent-activity');
    if (activityContainer) {
        activityContainer.innerHTML = '';
        const recentActivities = [...salesHistory].reverse().filter(r => new Date(r.date).getFullYear() === selectedDashboardYear).slice(0, 8); 
        if (recentActivities.length === 0) {
            activityContainer.innerHTML = '<p style="color:#777; font-size:12px; text-align:center; padding:20px;">No recent activity.</p>';
        } else {
            recentActivities.forEach(act => {
                const isOut = act.type === 'OUT';
                const amountClass = isOut ? 'amount-out' : 'amount-in';
                const sign = isOut ? '-' : '+';
                activityContainer.innerHTML += `
                    <div class="pd-feed-item">
                        <div class="pd-feed-info">
                            <strong>${act.name}</strong>
                            <span>${act.date} • ${act.user}</span>
                        </div>
                        <div class="pd-feed-amount ${amountClass}">
                            ${sign}${act.qty}
                        </div>
                    </div>
                `;
            });
        }
    }
}

let barChartInst = null;
let pieChartInst = null;

function renderCharts(labels, data, topProducts) {
    const barCtx = document.getElementById('barChart');
    const pieCtx = document.getElementById('pieChart');

    if (!barCtx || !pieCtx) return;

    if (barChartInst) barChartInst.destroy();
    if (pieChartInst) pieChartInst.destroy();

    const currentTheme = localStorage.getItem('theme_' + activeUser) || 'blue';
    const mainColor = themeColors[currentTheme] ? themeColors[currentTheme].main : '#06428d';

    const isDark = currentTheme === 'black';
    const textColor = isDark ? '#ccc' : '#666';
    const gridColor = isDark ? '#444' : '#eee';

    barChartInst = new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: `Monthly Sales (${selectedDashboardYear}) ₱`,
                data: data,
                backgroundColor: mainColor
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            scales: {
                x: { 
                    ticks: { color: textColor }, 
                    grid: { color: gridColor } 
                },
                y: { 
                    ticks: { color: textColor }, 
                    grid: { color: gridColor },
                    suggestedMax: 250000 
                }
            },
            plugins: { legend: { labels: { color: textColor } } }
        }
    });

    const pieLabels = topProducts.map(p => p.name);
    const pieData = topProducts.map(p => p.qty);

    pieChartInst = new Chart(pieCtx, {
        type: 'pie',
        data: {
            labels: pieLabels.length > 0 ? pieLabels : ['No Data'],
            datasets: [{
                data: pieData.length > 0 ? pieData : [1],
                backgroundColor: ['#dd4b39', '#00a65a', '#f39c12', '#00c0ef', '#605ca8', '#ccc'],
                borderColor: isDark ? '#2d2d2d' : '#fff'
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: textColor } } }
        }
    });
}

function renderNotes() {
    const container = document.getElementById('notes-list-container');
    if (!container) return;
    container.innerHTML = '';

    if (notesHistory.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#777; margin-top:20px;">No notes posted yet.</p>';
        return;
    }

    notesHistory.forEach(note => {
        const card = document.createElement('div');
        card.className = 'note-card';
        
        let deleteBtn = '';
        if (activeUser === 'Admin' || activeUser === note.author) {
            deleteBtn = `<button class="btn-delete-note" onclick="deleteNote(${note.id})">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
            </button>`;
        }

        card.innerHTML = `
            <img src="${note.avatar}" alt="User" class="note-avatar">
            <div class="note-content">
                <div class="note-header">
                    <span class="note-author">${note.author}</span>
                    <span class="note-date">${note.date}</span>
                </div>
                <div class="note-text">${note.text}</div>
            </div>
            ${deleteBtn}
        `;
        container.appendChild(card);
    });
}

if (document.getElementById('btn-post-note')) {
    document.getElementById('btn-post-note').addEventListener('click', () => {
        const input = document.getElementById('note-input');
        const text = input.value.trim();
        if (!text) return;

        const now = new Date();
        const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' at ' + now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        
        const avatar = document.getElementById('navProfilePic').src;

        notesHistory.unshift({
            id: Date.now(),
            author: activeUser,
            avatar: avatar,
            date: dateStr,
            text: text
        });

        localStorage.setItem('ims_notes_history', JSON.stringify(notesHistory));
        input.value = '';
        renderNotes();
    });
}

window.deleteNote = async function(id) {
    const confirmed = await customConfirm("Are you sure you want to delete this note?");
    if (confirmed) {
        notesHistory = notesHistory.filter(n => n.id !== id);
        localStorage.setItem('ims_notes_history', JSON.stringify(notesHistory));
        renderNotes();
    }
};

let attendanceScannerInstance = null;
let isAttendanceCooldown = false;
let attendanceCooldownInterval = null;

window.deleteAttendanceRecord = async function(id) {
    const confirmed = await customConfirm("Are you sure you want to delete this attendance record?");
    if (confirmed) {
        attendanceHistory = attendanceHistory.filter(a => a.id !== id);
        localStorage.setItem('ims_attendance_history', JSON.stringify(attendanceHistory));
        renderAttendanceTable();
    }
};

async function fetchUsersForAttendance() {
    try {
        const response = await fetch('http://localhost:8080/api/users/all');
        const users = await response.json();
        const datalist = document.getElementById('user-suggestions');
        if (datalist) {
            datalist.innerHTML = '';
            users.forEach(u => {
                const option = document.createElement('option');
                option.value = (u.fullName && u.fullName !== 'N/A' && u.fullName !== 'undefined') ? u.fullName : u.username;
                datalist.appendChild(option);
            });
        }
    } catch(e) { console.error(e); }
}

function recordAttendance(name) {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US');
    const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    
    const existingRecord = attendanceHistory.find(a => a.name === name && a.date === dateStr);
    
    if (existingRecord) {
        if (existingRecord.timeOut) {
            customAlert(`${name} has already timed out for today.`);
            return;
        } else {
            existingRecord.timeOut = timeStr;
            localStorage.setItem('ims_attendance_history', JSON.stringify(attendanceHistory));
            renderAttendanceTable();
            
            const inputField = document.getElementById('attendance-name-input');
            if(inputField) inputField.value = '';
            
            try {
                let beep = new Audio('Audio/BeepSound.mp3');
                beep.play().catch(e => console.log(e));
            } catch (e) {}
            return;
        }
    }
    
    attendanceHistory.unshift({
        id: Date.now(),
        date: dateStr,
        timeIn: timeStr,
        timeOut: '',
        name: name,
        status: 'Present'
    });
    localStorage.setItem('ims_attendance_history', JSON.stringify(attendanceHistory));
    renderAttendanceTable();
    
    const inputField = document.getElementById('attendance-name-input');
    if(inputField) inputField.value = '';
    
    try {
        let beep = new Audio('Audio/BeepSound.mp3');
        beep.play().catch(e => console.log(e));
    } catch (e) {}
}

function renderAttendanceTable() {
    const tbody = document.getElementById('attendanceTableBody');
    const viewHistoryBtn = document.getElementById('btn-view-attendance-history');
    const actionHeader = document.getElementById('attendance-action-header');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (actionHeader) {
        actionHeader.style.display = canManageAttendance ? 'table-cell' : 'none';
    }

    const now = new Date();
    const todayStr = now.toLocaleDateString('en-US');

    const todaysRecords = attendanceHistory.filter(r => r.date === todayStr);
    const pastRecords = attendanceHistory.filter(r => r.date !== todayStr);

    if (viewHistoryBtn) {
        viewHistoryBtn.style.display = pastRecords.length > 0 ? 'inline-block' : 'none';
    }

    if (todaysRecords.length === 0) {
        const colspan = canManageAttendance ? "6" : "5";
        tbody.innerHTML = `<tr><td colspan="${colspan}" style="text-align: center; padding: 20px; color: #777;">No attendance recorded for today.</td></tr>`;
        return;
    }

    todaysRecords.forEach(record => {
        const tr = document.createElement('tr');
        
        let actionHtml = '';
        if (canManageAttendance) {
            actionHtml = `<td><button style="background-color: #d9534f; color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center; margin: 0 auto;" onclick="deleteAttendanceRecord(${record.id})">✖</button></td>`;
        }

        tr.innerHTML = `
            <td>${record.date}</td>
            <td>${record.timeIn}</td>
            <td>${record.timeOut || '--:--'}</td>
            <td style="font-weight: bold;">${record.name}</td>
            <td><span style="background-color: #28a745; color: white; padding: 3px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;">${record.status}</span></td>
            ${actionHtml}
        `;
        tbody.appendChild(tr);
    });
}

function renderAttendanceHistory() {
    const list = document.getElementById('attendanceHistoryList');
    if (!list) return;
    list.innerHTML = '';

    const grouped = {};
    attendanceHistory.forEach(record => {
        if (!grouped[record.date]) grouped[record.date] = [];
        grouped[record.date].push(record);
    });

    const todayStr = new Date().toLocaleDateString('en-US');
    const dates = Object.keys(grouped).filter(d => d !== todayStr).sort((a,b) => new Date(b) - new Date(a)); 

    if (dates.length === 0) {
        list.innerHTML = '<p style="text-align: center; padding: 20px; color: #777;">No past attendance records found.</p>';
        return;
    }

    dates.forEach(date => {
        const dateObj = new Date(date);
        const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
        
        const dParts = date.split('/');
        const displayDate = `${dParts[1].padStart(2, '0')}/${dParts[0].padStart(2, '0')}/${dParts[2]}`;
        
        const row = document.createElement('div');
        row.className = 'attendance-history-row';
        row.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 15px; border: 1px solid #ccc; border-radius: 8px; background: #f9f9f9;';
        
        row.innerHTML = `
            <span style="font-weight: bold; color: #333;">${displayDate} - ${dayOfWeek} - ATTENDANCE SHEET</span>
            <button class="modal-btn-primary" onclick="printAttendanceSheet('${date}')" style="padding: 5px 15px;">View (PDF)</button>
        `;
        list.appendChild(row);
    });
}

window.printAttendanceSheet = function(date) {
    const records = attendanceHistory.filter(r => r.date === date);
    
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
    
    const dParts = date.split('/');
    const displayDate = `${dParts[1].padStart(2, '0')}/${dParts[0].padStart(2, '0')}/${dParts[2]}`;

    let html = `
        <div style="text-align: center; margin-bottom: 30px; width: 100%;">
            <h2 style="margin: 0 0 10px 0; font-family: Arial, sans-serif; color: #000 !important; -webkit-text-fill-color: #000 !important;">Natnat's Inventory Management System</h2>
            <h3 style="margin: 0; font-family: Arial, sans-serif; color: #000 !important; -webkit-text-fill-color: #000 !important;">${displayDate} - ${dayOfWeek.toUpperCase()} - ATTENDANCE SHEET</h3>
        </div>
        <table style="width: 80%; border-collapse: collapse; text-align: center; font-size: 14px; margin: 0 auto; font-family: Arial, sans-serif;">
            <thead>
                <tr>
                    <th style="border: 1px solid #000; padding: 12px; background-color: #eee; color: #000 !important; -webkit-text-fill-color: #000 !important;">Time In</th>
                    <th style="border: 1px solid #000; padding: 12px; background-color: #eee; color: #000 !important; -webkit-text-fill-color: #000 !important;">Time Out</th>
                    <th style="border: 1px solid #000; padding: 12px; background-color: #eee; color: #000 !important; -webkit-text-fill-color: #000 !important;">Name</th>
                    <th style="border: 1px solid #000; padding: 12px; background-color: #eee; color: #000 !important; -webkit-text-fill-color: #000 !important;">Status</th>
                </tr>
            </thead>
            <tbody>
    `;
    records.forEach(r => {
        html += `
            <tr>
                <td style="border: 1px solid #000; padding: 10px; color: #000 !important; -webkit-text-fill-color: #000 !important;">${r.timeIn}</td>
                <td style="border: 1px solid #000; padding: 10px; color: #000 !important; -webkit-text-fill-color: #000 !important;">${r.timeOut || '--:--'}</td>
                <td style="border: 1px solid #000; padding: 10px; font-weight: bold; color: #000 !important; -webkit-text-fill-color: #000 !important;">${r.name}</td>
                <td style="border: 1px solid #000; padding: 10px; color: #000 !important; -webkit-text-fill-color: #000 !important;">${r.status}</td>
            </tr>
        `;
    });
    html += `</tbody></table>`;
    
    document.getElementById('print-attendance-sheet').innerHTML = html;
    document.body.classList.add('printing-attendance');
    setTimeout(() => {
        window.print();
        document.body.classList.remove('printing-attendance');
    }, 500);
};

const startScanBtn = document.getElementById('btn-start-attendance-scan');
const stopScanBtn = document.getElementById('btn-stop-attendance-scan');

if (startScanBtn && stopScanBtn) {
    startScanBtn.addEventListener('click', () => {
        startScanBtn.style.display = 'none';
        stopScanBtn.style.display = 'block';
        
        attendanceScannerInstance = new Html5QrcodeScanner(
            "attendance-reader",
            { 
                fps: 10, 
                qrbox: { width: 300, height: 100 },
                aspectRatio: 1.5,
                formatsToSupport: [ 
                    Html5QrcodeSupportedFormats.QR_CODE
                ],
                experimentalFeatures: {
                    useBarCodeDetectorIfSupported: true
                }
            },
            false
        );
        
        attendanceScannerInstance.render((decodedText) => {
            if (isAttendanceCooldown) return;

            const name = decodedText.trim();
            recordAttendance(name);
            
            isAttendanceCooldown = true;
            const msgEl = document.getElementById('attendance-timeout-msg');
            if (msgEl) msgEl.textContent = "Cooldown: Please wait 5s...";
            
            let countdown = 5;
            if (attendanceCooldownInterval) clearInterval(attendanceCooldownInterval);
            
            attendanceCooldownInterval = setInterval(() => {
                countdown--;
                if (countdown > 0) {
                    if (msgEl) msgEl.textContent = `Cooldown: Please wait ${countdown}s...`;
                } else {
                    clearInterval(attendanceCooldownInterval);
                    isAttendanceCooldown = false;
                    if (msgEl) msgEl.textContent = "";
                }
            }, 1000);

        }, (err) => {});
    });

    stopScanBtn.addEventListener('click', () => {
        startScanBtn.style.display = 'block';
        stopScanBtn.style.display = 'none';
        
        isAttendanceCooldown = false;
        if (attendanceCooldownInterval) clearInterval(attendanceCooldownInterval);
        const msgEl = document.getElementById('attendance-timeout-msg');
        if (msgEl) msgEl.textContent = "";

        if (attendanceScannerInstance) {
            attendanceScannerInstance.clear().catch(e => console.log(e));
            attendanceScannerInstance = null;
        }
    });
}

const manualTimeInBtn = document.getElementById('btn-manual-attendance');
if (manualTimeInBtn) {
    manualTimeInBtn.addEventListener('click', () => {
        const nameInput = document.getElementById('attendance-name-input');
        if (nameInput) {
            const name = nameInput.value.trim();
            if (name) {
                recordAttendance(name);
            }
        }
    });
}

const btnViewHistory = document.getElementById('btn-view-attendance-history');
if (btnViewHistory) {
    btnViewHistory.addEventListener('click', () => {
        renderAttendanceHistory();
        const overlay = document.getElementById('attendanceHistoryModalOverlay');
        overlay.classList.remove('hiding');
        overlay.classList.add('active');
    });
}

const btnCloseHistory = document.getElementById('btn-close-attendance-history');
if (btnCloseHistory) {
    btnCloseHistory.addEventListener('click', () => {
        const overlay = document.getElementById('attendanceHistoryModalOverlay');
        overlay.classList.add('hiding');
        setTimeout(() => {
            overlay.classList.remove('active');
            overlay.classList.remove('hiding');
        }, 300);
    });
}

const btnGenerateId = document.getElementById('btn-generate-id');
if (btnGenerateId) {
    btnGenerateId.addEventListener('click', async () => {
        const nameInput = document.getElementById('attendance-name-input');
        const targetName = nameInput ? nameInput.value.trim() : '';
        if (!targetName) {
            await customAlert("Please enter a user name to generate an ID.");
            return;
        }

        try {
            const response = await fetch('http://localhost:8080/api/users/all');
            const users = await response.json();
            
            const user = users.find(u => 
                (u.fullName && u.fullName === targetName) || 
                (u.username === targetName)
            );

            if (!user) {
                await customAlert("User not found. Please enter a valid name from the suggestions.");
                return;
            }

            document.getElementById('id-name').textContent = (user.fullName && user.fullName !== 'N/A' && user.fullName !== 'undefined') ? user.fullName : user.username;
            document.getElementById('id-role').textContent = user.role || 'Storekeeper / Stock Clerk';
            document.getElementById('id-date-joined').textContent = "Date Joined: " + (user.dateCreated || 'N/A');
            document.getElementById('id-profile-pic').src = user.profilePicture || 'Images/placeholder.png';
            
            const qrContainer = document.getElementById('id-qr');
            qrContainer.innerHTML = ''; 
            new QRCode(qrContainer, {
                text: targetName,
                width: 100,
                height: 100,
                colorDark : "#000000",
                colorLight : "#ffffff",
                correctLevel : QRCode.CorrectLevel.H
            });

            const idContainer = document.getElementById('print-id-card');
            idContainer.style.display = 'flex';
            document.body.classList.add('printing-id');
            setTimeout(() => {
                window.print();
                document.body.classList.remove('printing-id');
                idContainer.style.display = 'none';
            }, 500);

        } catch (e) {
            console.error(e);
            await customAlert("Failed to fetch user data.");
        }
    });
}

const savedMainTab = sessionStorage.getItem('activeTab') || 'Dashboard';
const mainTabNode = Array.from(navItems).find(i => i.getAttribute('data-target') === savedMainTab);
if (mainTabNode) {
    mainTabNode.click();
}