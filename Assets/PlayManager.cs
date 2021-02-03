using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.SceneManagement;





public class PlayManager : MonoBehaviour
{
    public GameObject PlayerPref;

    public int thisIsPlayer;

    NetworkingClient Client;
    public GameObject EndScreen;

    public List<GameObject> Spawns;
    public List<Players> PlayersList;
    [System.Serializable]
    public class Players
    {
        public GameObject Player;
        public string Name;
        public string ID;

        public Color PlayerColor;
    }

    void Start()
    {


        Client = GameObject.Find("NetworkManager").GetComponent<NetworkingClient>();
        Client.PlayManager = this;
        thisIsPlayer = Client.Index;
        getPlayers();
        Spawn();
    }

    public void getPlayers()
    {
        Client.writeCommand("GAME_" + "GETPLAYERS");
    }

    public void SetNames()
    {
        if (thisIsPlayer == 0)
        {
            GameObject.Find("myName").GetComponent<Text>().text = PlayersList[0].Name;
            GameObject.Find("EnemyName").GetComponent<Text>().text = PlayersList[1].Name;
        }
        else
        {
            GameObject.Find("myName").GetComponent<Text>().text = PlayersList[1].Name;
            GameObject.Find("EnemyName").GetComponent<Text>().text = PlayersList[0].Name;
        }

    }

    public void Spawn()
    {
        for (int P = 0; P < PlayersList.Count; P++)
        {
            PlayersList[P].Player = Instantiate(PlayerPref, Spawns[P].transform.position, Spawns[P].transform.rotation);
            PlayersList[P].Player.GetComponent<SpriteRenderer>().color = PlayersList[P].PlayerColor;
            PlayersList[P].Player.GetComponent<PlayerBrain>().shipIndex = P;
            Spawns[P].SetActive(false);
        } 
    }

    public void Death(int shipIndex)
    {
        string result = "Winner!";

        if(shipIndex == thisIsPlayer)
        {
            Client.writeCommand("GAME_" + "END" + thisIsPlayer);
            result = "Loser!";
        }
        Debug.Log("Ship " + shipIndex + " destroyed.");

        EndScreen.GetComponentInChildren<Text>().text = result;
        EndScreen.SetActive(true);
        
    }

    public void BackToMenu()
    {
        SceneManager.LoadScene(1);
    }

    void Update()
    {
        if (thisIsPlayer == 0)
        {
            GameObject.Find("MyHP").GetComponent<Text>().text = PlayersList[0].Player.GetComponent<PlayerBrain>().Health.ToString();
            GameObject.Find("EnemyHP").GetComponent<Text>().text = PlayersList[1].Player.GetComponent<PlayerBrain>().Health.ToString();
        }
        else
        {
            GameObject.Find("MyHP").GetComponent<Text>().text = PlayersList[1].Player.GetComponent<PlayerBrain>().Health.ToString();
            GameObject.Find("EnemyHP").GetComponent<Text>().text = PlayersList[0].Player.GetComponent<PlayerBrain>().Health.ToString();
        }


    }


    public void Control(string input)
    {
        Client.writeCommand("GAME_" + "MOVE" + input + "@" + thisIsPlayer);
    }

    public void SimulateMove(string input, int PlayerIndex)
    {
        switch(input)
        {
            case "up":
                PlayersList[PlayerIndex].Player.GetComponent<PlayerBrain>().up();
                break;
            case "down":
                PlayersList[PlayerIndex].Player.GetComponent<PlayerBrain>().down();
                break;
            case "left":
                PlayersList[PlayerIndex].Player.GetComponent<PlayerBrain>().left();
                break;
            case "right":
                PlayersList[PlayerIndex].Player.GetComponent<PlayerBrain>().right();
                break;
            case "space":
                PlayersList[PlayerIndex].Player.GetComponent<PlayerBrain>().Fire();
                break;

            default:
                Debug.LogError("Bad input");
                break;

        }
    }
}
