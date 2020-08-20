let id_ = null;
let click = false;
let firstLoad = false;
let inputEmoji;

$(document).ready(() => {
    let curURI = window.location.href;

    if(curURI != BASE_URL) {   
        loadUsers();

        setInterval(() => {
            if (id_ && click) {
                loadMessages();
            }
        }, 1250);

        /*inputEmoji =$("#mensagem").emojioneArea({
            pickerPosition: "top",
            filtersPosition: "top",
            tonesStyle: "checkbox"
        });*/
    }
});

$('#btnSignup').on('click', () => {
    $('#modalSignup').modal();
});

$('.sent').on('click', () => {
    sendMessage();
});

$(document).on('keypress', (e) => {
    if (e.which == 13) sendMessage();
});

function deleteMessages() {
    $.ajax({
        type: 'POST',
        url: 'deleteMessages.php',
        success: (msg) => { console.log(msg) },
        error: (e) => { console.log(e) }
    });
}

function loadMessages() {
    let createMessages = (data) => {
        let str = `
            <div class="row form-group" style="margin-top: 0.8rem">
                <div class="offset-2 col-8">
                    <div style="text-align: center">
                        <div class="card wa-card-chat wa-card-yellow">
                            As mensagens que você enviar e as ligações que você fizer nessa conversa estão protegidas com criptografia de ponta-a-ponta.
                            Clique para mais informações.
                        </div> 
                    </div>
                </div>
            </div>
        `;

        if (data) {
            data.messages.forEach((messages) => {
                if (data.id_sender == messages.id_de) {
                    str +=
                    `<div class="row form-group">
                        <div class="offset-6 col-5">
                            <div class="card wa-card-chat wa-card-green">
                                ${messages.mensagem}
                                <div class="wa-card-chat-bottom-right">
                                    <span style="font-size: 12px; color: #A3A3A3">${messages.data_hora}</span>
                                    <i class="large material-icons wa-icon wa-chat-icon">&nbsp;</i>
                                </div>
                            </div>
                        </div>
                    </div>`
                } else {
                    str +=
                    `<div class="row form-group">
                        <div class="col-5 offset-1">
                            <div class="card wa-card-chat wa-card-default" style="direction: left">
                                ${messages.mensagem}
                                <div class="wa-card-chat-bottom-right">
                                    <span style="font-size: 12px; color: #A3A3A3">${messages.data_hora}</span>
                                    <i class="large material-icons wa-icon wa-chat-icon">done</i>
                                </div>
                            </div>
                        </div>
                    </div>`;
                }

                $('.wa-panel-texto').show();
                $('.navbar-message').css('display', 'flex');
            });

            $('.messages-box').html(str);
        }

        if (click) { 
            $('.messages-box').html(str);
            $('.wa-panel-texto').show();
            $('.navbar-message').css('display', 'flex');
        } 
    }

    $.ajax({
        type: 'POST',
        url: BASE_URL + 'Chat/returnMessages',
        data: {
            id_contato: id_
        },
        success: (data) => { createMessages(data) },
        error: (e) => { console.log(e) }
    });
}

function fixScrollChatBottom() {
    $('.messages-box').scrollTop($('.messages-box')[0].scrollHeight);

    return false;
}

function loadUsers() {
    let createMenu = (data) => {
        let listContact = $('.list-contacts');

        if (!data.length)
            return false
        
        data.forEach((user) => {
            let message = user.mensagem ? user.mensagem : 'Clique para iniciar..';
            let date    = user.data ? user.data : '';
            let image   = user.imagem ? user.imagem : 'https://cdn3.iconfinder.com/data/icons/diversity-avatars/64/hipster-man-asian-512.png';

            let template = `
                <div class="col-12 wa-item-chat" id="${user.id}">
                    <div class="row">
                        <div class="col-2">
                            <img src="${image}" class="rounded-circle mx-auto d-block"/>
                        </div>

                        <div class="col-6" style="border-bottom: solid 1px #F5F5F5">
                            <span style="color: #454545" id="name-${user.id}"><strong>${user.nome}</strong></span><br/>
                            <span style="display: none" id="email-${user.id}">${user.email}</span>
                            <p class="wa-preview-message mt-10">${message}</p>
                        </div>

                        <div class="col-4" style="text-align: right; border-bottom: solid 1px #F5F5F5">
                            <span style="font-size: 10px">${date}</span>
                        </div>
                    </div>
                </div>
            `;

            listContact.append(template);

            $(`#${user.id}`).on('click', () => {
                click   = true;
                id_     = user.id;

                let inf    = `${$('#name-' + id_).text()} &lt;${$('#email-' + id_).text()}&gt;`;
                let status = user.inicio > 0 ? 'Online' : 'visto por último em 01/02/2019 ás 00:00'
               
                $('#nome_contato').html(inf);
                $('#status_contato').html(status);
                $('#imagem_contato').attr('src', image);

                $(`.wa-item-chat`).removeClass('wa-item-chat-active');
                $(`#${user.id}`).addClass('wa-item-chat-active');
 
                loadMessages();
            });
        });
    }

    $.ajax({
        type: 'GET',
        url: BASE_URL + 'Chat/returnListUsers',
        success: (data) => { createMenu(data) },
        beforeSend: ()  => { $('#loadingContacts').fadeIn() },
        complete: ()    => { $('#loadingContacts').fadeOut() },
        error: (e)      => {  $('#loadingContacts').fadeOut(); console.log(e) }
    });
}

function sendMessage() {
    const requestMessage = () => {
        $.ajax({
            type: 'POST',
            url: BASE_URL + 'Chat/sendMessage',
            data: {
                mensagem: $("#mensagem").val(),
                id_contato: id_
            },
            success: (msg) => {
                if (msg.status == 'OK') { 
                    loadMessages() 
                }
            },
            complete: () => { fixScrollChatBottom() },
            error: (e) => { console.log(e) }
        });

        $("#mensagem").val('');
    }

    if ($('#mensagem').val() == '') {
        alert('Digite uma mensagem!');
        return false;
    }
    
    requestMessage();
    
    return false;
}