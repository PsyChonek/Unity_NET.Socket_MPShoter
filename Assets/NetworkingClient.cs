using UnityEngine;//Unity
using System.Net.Sockets;//Socket communication library
using System.Text;//For encoding and decoding data
using System;//For using the Action interface
using UnityEngine.UI;
using System.Collections;
using UnityEngine.SceneManagement;
using System.Linq;
using System.Threading;
using System.Collections.Generic;

public class NetworkingClient : MonoBehaviour
{
    TcpClient client = new TcpClient();//TCP client instance
    NetworkStream stream;//We use it for writing and reading from the server.

    public string IP = "90.180.150.77";//Server IP
    const int PORT = 8080;//Server listening port
    const double memory = 50000;//this means 5mb in bytes
    const int connectionLimitTime = 5000;//connection limit time in milliseconds

    private byte[] data = new byte[(int)memory];//Where we storage the data comming from the server
    public bool running = false;//To know if the client loop is running

    public string id = ""; //unique client id
    public string Username = "";
    public bool inGame = false;

    public int Index;
    public string gameID = "";
    public PlayManager PlayManager;


    public bool reading = false;// to know if we're reading from the server
    public bool writing = false;// to know if we're writing from the server
    public bool searchingMatch = false;// to know if we're searching a match
    public bool connected = false; // to know if we're connected to the server
    public bool PingOnce = false;


    static bool created = false;

    static Thread mainThread = Thread.CurrentThread;

    public IList<string> CommandQueue = new List<string>();


   
    void Awake()
    {


        if (!created)
        {
            DontDestroyOnLoad(this.gameObject);
            created = true;
        }
        else
        {
            Destroy(this.gameObject);
        }

        //We try to connect to the server
        StartCoroutine(connect(0f));

        QualitySettings.vSyncCount = 0;  
        Application.targetFrameRate = 200;
    }

    private void Start()
    {
        
    }

    public void readCommand(string command)
    {
        if (Thread.CurrentThread != mainThread)
        {
            Debug.LogWarning("This is not the main thread.");
            Debug.LogWarning(command);
        }

        if (command == "CONNECTED")
        {
            Debug.Log("Connected");
            connected = true;
        }
        else if (command.StartsWith("ID"))
        {
            id = command.Replace("ID", "");
            Debug.Log("ID Recieved");

            writeCommand("PING");
        }
        else if (command.StartsWith("Player"))
        {
            Username = command;
            Debug.Log("Load Menu");
            SceneManager.LoadScene(1);
        }


        else if (command.StartsWith("IN_GAME"))
        {
            gameID = command.Replace("IN_GAME", "");
            inGame = true;
            searchingMatch = false;
        }
        else if (command.StartsWith("INDEX"))
        {
            string temp = command.Replace("INDEX", "");
            Index = Int32.Parse(temp);
            if (inGame)
            {
                Debug.Log("Load Scene");
                SceneManager.LoadScene(2);
            }
        }
        else if (command.StartsWith("GAMEPLAYERS"))
        {
            //  GAMEPLAYERSPlayer41541@s645a1d6as54d
            string temp = command.Replace("GAMEPLAYERS", "");
            //  1Player41541@s645a1d6as54d
            int dataindex = temp[0] - '0';
            //  Player41541@s645a1d6as54d
            string[] data = temp.Remove(0, 1).Split('@');
            //  Player41541
            //  s645a1d6as54d
            PlayManager.PlayersList[dataindex].Name = data[0];
            PlayManager.PlayersList[dataindex].ID= data[1];
            PlayManager.SetNames();

        }
        else if (command == "ENEMY_LEFT")
        {
            Debug.Log("Load Scene");
            inGame = false;
            SceneManager.LoadScene(1);
        }
        else if (command.StartsWith("ENEMY_MOVE"))
        {
            string output = command.Replace("ENEMY_MOVE", "");         

            string move = output.Remove(output.Length - 1);
            char indexOfMovedPlayer = output[output.Length - 1];
            PlayManager.SimulateMove(move, indexOfMovedPlayer - '0');
        }
        else
        {
            Debug.Log(command);
        }
    }


    IEnumerator Delay()
    {
        yield return new WaitForSeconds(5f);
        writeCommand("PING");
        PingOnce = false;      
    }

    public void writeCommand(string command)
    {
        if (connected)
        {
            try
            {
                writing = true;
                command += '\n';
                stream.BeginWrite(Encoding.UTF8.GetBytes(command), 0, command.Length, new AsyncCallback(writtingDone), stream);
            }
            catch (Exception)
            {
                Debug.LogError("Connection lost!");
                writing = false;
                connected = false;
                reading = false;
                running = false;
                PingOnce = false;

                stream.Close();
                client.Close();

                client = new TcpClient();

                StartCoroutine(connect(5f));
            }
        }
        else
        {
            Debug.Log("Not connected!");
        }
    }


    void writtingDone(IAsyncResult arr)
    {
        writing = false;
        stream.EndWrite(arr);
    }


    public void readingDone(IAsyncResult arr)
    {
        reading = false;
        int t = stream.EndRead(arr);
        string message = Encoding.UTF8.GetString(data, 0, t);

        //Debug.Log(message);
        string[] commands = message.Split('\n');
        //Debug.Log(commands.Length);

        foreach (string command in commands)
        {
            if (command != "")
            {
                CommandQueue.Add(command);
            }
        }
    }




    private void Update()
    {
        if (CommandQueue.Count > 0)
        {
            readCommand(CommandQueue[0]);
            CommandQueue.RemoveAt(0);
        }
        
        if (running == true)
        {
            if (stream.DataAvailable)
            {
                reading = true;
                stream.BeginRead(data, 0, data.Length, new AsyncCallback(readingDone), stream);
            }

            if (!PingOnce)
            {
                PingOnce = true;
                StartCoroutine(Delay());
            }
        }


    }

    IEnumerator connect(float time)
    {
        yield return new WaitForSeconds(time);
        try
        {
            client.ConnectAsync(IP, PORT).Wait(connectionLimitTime);            
            stream = client.GetStream();
            running = true;
        }

        catch (Exception e)
        {
            Debug.LogError("Connection Failed! " + e);
            StartCoroutine(connect(5f));
        }

    }


    private void OnApplicationQuit()
    {
        running = false;
    }


}
