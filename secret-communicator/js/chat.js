
    function ChatUi() {
        // body...
    }
    var Message = function (arg) {
        this.text = arg.text;
        this.message_side = arg.message_side;
        this.sign_status = arg.sign_status;
        this.draw = function (_this) {
            return function () {
                var $message;
                $message = $($('.message_template').clone().html());
                $message.addClass(_this.message_side).find('.text').html(_this.text);
                $('.messages').append($message);
                if(this.sign_status!=undefined){
                    $message.addClass("sign_status-" + this.sign_status)
                }
                return setTimeout(function () {
                    return $message.addClass('appeared');
                }, 0);
            };
        }(this);
        return this;
    };

    
    ChatUi.prototype.getMessageText = function () {
        var $message_input;
        $message_input = $('.message_input');
        return $message_input.val();
    };
    ChatUi.prototype.displayMessage = function (text,mine,sign_status) {
        var $messages, message;
        if (text == undefined || text == '') {
            return;
        }
        $('.message_input').val('');
        $messages = $('.messages');
        message_side = mine ? 'left' : 'right';
        message = new Message({
            text: text,
            message_side: message_side,
            sign_status: sign_status
        });
        message.draw();
        return $messages.animate({ scrollTop: $messages.prop('scrollHeight') }, 300);
    };
