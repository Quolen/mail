document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  document.querySelector('#compose-form').onsubmit = send_email;

  // By default, load the inbox
  load_mailbox('inbox');
});

function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    // Loop through the emails
    emails.forEach(email => {
      const emailDiv = document.createElement('div');
      emailDiv.classList.add('email');
      emailDiv.innerHTML = `
        <p>From: ${email.sender}</p>
        <p>Subject: ${email.subject}</p>
        <p>Timestamp: ${email.timestamp}</p>
      `;  
      emailDiv.addEventListener('click', function() {
        fetch(`/emails/${email.id}`)
        .then(response => response.json())
        .then(email => {
          // Create a new div for email content
          const emailContentDiv = document.createElement('div');
          emailContentDiv.classList.add('email-content');
          emailContentDiv.innerHTML = `
            <p>From: ${email.sender}</p>
            <p>To: ${email.recipients.join(', ')}</p>
            <p>Subject: ${email.subject}</p>
            <p>Timestamp: ${email.timestamp}</p>
            <p>Body: ${email.body}</p>
            ${mailbox !== 'sent' ? `<button class="btn btn-sm btn-outline-primary archive-btn">${email.archived ? 'Unarchive' : 'Archive'} the email</button>
            <button class="btn btn-sm btn-outline-primary reply-btn">Reply</button>` : ''}
            <button class="btn btn-sm btn-outline-primary back-btn">Back to ${mailbox}</button>
          `;
          // Append the email content div to the emails-view section
          document.querySelector('#emails-view').innerHTML = '';
          document.querySelector('#emails-view').appendChild(emailContentDiv);
          
          if (mailbox !== 'sent') {
            const archiveButton = document.querySelector('.archive-btn');
            archiveButton.addEventListener('click', () => {
              fetch(`/emails/${email.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                  archived: !email.archived
                })
              })
              .then(() => load_mailbox(mailbox))
              .catch(error => console.error('Error archiving/unarchiving email:', error));
            });

            const replyButton = document.querySelector('.reply-btn');
            replyButton.addEventListener('click', () => {
              compose_email();
              // Pre-fill composition form
              document.querySelector('#compose-recipients').value = email.sender;
              document.querySelector('#compose-subject').value = email.subject.startsWith('Re: ') ? email.subject : `Re: ${email.subject}`;
              document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote:\n${email.body}`;
            });
          }

          const backButton = document.querySelector('.back-btn');
          backButton.addEventListener('click', () => {
            load_mailbox(mailbox);
          });

          if (!email.read) {
            fetch(`/emails/${email.id}`, {
              method: 'PUT',
              body: JSON.stringify({
                read: true
              })
            })
            .then(() => {
              emailDiv.style.backgroundColor = 'gray';
            })
            .catch(error => console.error('Error marking email as read:', error));
          }
        });
      });

      emailDiv.style.backgroundColor = email.read ? 'gray' : 'white';
      document.querySelector('#emails-view').appendChild(emailDiv);
    });
  })
  .catch(error => {
    console.error('Error loading emails:', error);
  });
}

function send_email(event) {
  event.preventDefault();

  const recipient = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  if (!recipient || !subject || !body) {
    alert('Please fill out all fields before sending the email.');
    return;
  }

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: recipient,
      subject: subject,
      body: body
    })
  })
  .then(response => response.json())
  .then(result => {
    load_mailbox('sent');
  });
}

function compose_email() {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}
