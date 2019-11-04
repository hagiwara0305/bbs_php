<?php

namespace src\RatchetChat;

use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;
use src\DB\DBAccess;

class Chat implements MessageComponentInterface
{
    protected $clients;

    public function __construct()
    {
        $this->clients = new \SplObjectStorage;
    }

    public function onOpen(ConnectionInterface $conn)
    {
        // 新しい接続を保存して、後でメッセージを送信する
        $this->clients->attach($conn);

        echo "New connection! ({$conn->resourceId})\n";
    }

    public function onMessage(ConnectionInterface $from, $msg)
    {
        $user_json = json_decode($msg, true);

        $numRecv = count($this->clients) - 1;

        echo sprintf('Connection %d sending message "%s" to %d other connection%s' . "\n"
            , $from->resourceId, $msg, $numRecv, $numRecv == 1 ? '' : 's');

        $user_json['name'] = htmlspecialchars($user_json['name'], ENT_QUOTES, "UTF-8");
        $user_json['message'] = htmlspecialchars($user_json['message'], ENT_QUOTES, "UTF-8");
        try {
            (new DBAccess())->getSQLExecution(
                'INSERT INTO chat_table (id, user_id, comment, sled_id) VALUES (NULL, :user_id, :user_comment, :sled_id)',
                [
                    ':user_id' => $user_json['id'],
                    ':user_comment' => $user_json['message'],
                    ':sled_id' => $user_json['sled_id']
                ]
            );
        } catch (PDOException $e) {
            print('Error:' . $e->getMessage());
            die();
        } finally {
            $dbh = null;
        }

        foreach ($this->clients as $client) {
            if ($from !== $client && $client->httpRequest->getRequestTarget() == "/?sled_id={$user_json['sled_id']}") {
                // 送信者は受信者ではなく、接続されている各クライアントに送信します
                $client->send(json_encode($user_json));
            }
        }
    }

    public function onClose(ConnectionInterface $conn)
    {
        // 接続が閉じられているので、メッセージを送信できなくなります
        $this->clients->detach($conn);

        echo "Connection {$conn->resourceId} has disconnected\n";
    }

    public function onError(ConnectionInterface $conn, \Exception $e)
    {
        echo "An error has occurred: {$e->getMessage()}\n";

        $conn->close();
    }
}
