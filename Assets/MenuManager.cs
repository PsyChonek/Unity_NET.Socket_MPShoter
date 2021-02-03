using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

public class MenuManager : MonoBehaviour
{
    InputField NameInput;
    Text UUID;
    GameObject NetworkManager;
    NetworkingClient Network;
    Image buttonImage;



    void Awake()
    {
        NameInput = GameObject.Find("Name").GetComponent<InputField>();
        NetworkManager = GameObject.Find("NetworkManager");
        Network = NetworkManager.GetComponent<NetworkingClient>();
        UUID = GameObject.Find("UUID").GetComponent<Text>();
        buttonImage = GameObject.Find("FindPlayer").GetComponent<Image>();
        // GameObject.Find("NameText").GetComponent<Text>().text = NetworkingClient.Username;
    }

    private void Start()
    {
        NameInput.text = Network.Username;
        UUID.text = Network.id;
    }


    // Update is called once per frame
    void Update()
    {
        Image ServerStatusImg = GameObject.Find("ServerStatusImg").GetComponent<Image>();
        if (Network.connected)
        {
            ServerStatusImg.color = Color.green;
        }
        else
        {
            ServerStatusImg.color = Color.red;
        }

        if (Network.searchingMatch == false)
        {
            buttonImage.color = Color.green;
        }
        else
        {
            buttonImage.color = Color.red;
        }
    }

    public void ChangeName()
    {
        Network.Username = NameInput.text;

        string nameChange = "SET_NAME" + Network.Username;

        NetworkManager.GetComponent<NetworkingClient>();
        Network.writeCommand(nameChange);
    }

    public void SearchForPlayer()
    {
        if (Network.searchingMatch == false)
        {
            buttonImage.color = Color.green;
            Network.searchingMatch = true;
            Network.writeCommand("SEARCHING_FOR_PLAYER");
            NameInput.interactable = false;
        }
        else
        {
            buttonImage.color = Color.red;
            Network.searchingMatch = false;
            Network.writeCommand("REMOVE_FROM_SEARCH");
            NameInput.interactable = true;
        }

    }
}
