using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class PlayerBrain : MonoBehaviour
{
    public int Health = 10;
    public int shipIndex;

    public GameObject Bullet;
    public int BullletSpeed = 10;
    public GameObject BulletSpawnPoint;

    public int Damage = 1;
    public float KeepAlive = 10;

    PlayManager PlayManager;

    void Start()
    {
        PlayManager = GameObject.Find("PlayManager").GetComponent<PlayManager>();
    }

    void Update()
    {
        if (shipIndex == PlayManager.thisIsPlayer)
        {
            if (Input.GetKeyDown("up") && gameObject.transform.position.y < 4 )
            {
                up();
                PlayManager.Control("up");
            }
            if (Input.GetKeyDown("down") && gameObject.transform.position.y > -4 )
            {
                down();
                PlayManager.Control("down");
            }
            if (Input.GetKeyDown("left") && gameObject.transform.position.x > -8)
            {
                left();
                PlayManager.Control("left");
            }
            if (Input.GetKeyDown("right") && gameObject.transform.position.x < 8)
            {
                right();
                PlayManager.Control("right");
            }

            if (Input.GetKeyDown("space"))
            {
                Fire();
                PlayManager.Control("space");
            }
        }

        if (Health < 1)
        {
            PlayManager.Death(shipIndex);
            gameObject.SetActive(false);
        }
    }

    public void Fire()
    {
        GameObject ShotedBullet = Instantiate(Bullet,BulletSpawnPoint.transform.position, transform.rotation);
        ShotedBullet.GetComponent<SpriteRenderer>().color = GetComponent<SpriteRenderer>().color;
        ShotedBullet.GetComponent<Rigidbody2D>().AddForce(transform.up * BullletSpeed);
        BulletBrain settings = ShotedBullet.GetComponent<BulletBrain>();
        settings.Damage = Damage;
        settings.KeepAlive = KeepAlive;
    }
    public void up()
    {
        gameObject.transform.position = new Vector3(gameObject.transform.position.x, gameObject.transform.position.y + 1, 0);
        transform.rotation = Quaternion.Euler(0, 0, 0);
    }
    public void down()
    {
        gameObject.transform.position = new Vector3(gameObject.transform.position.x, gameObject.transform.position.y - 1, 0);
        transform.rotation = Quaternion.Euler(0, 0, 180);
    }
    public void left()
    {
        gameObject.transform.position = new Vector3(gameObject.transform.position.x-1, gameObject.transform.position.y, 0);
        transform.rotation = Quaternion.Euler(0, 0, 90);
    }
    public void right()
    {
        gameObject.transform.position = new Vector3(gameObject.transform.position.x+1, gameObject.transform.position.y, 0);
        transform.rotation = Quaternion.Euler(0, 0, -90);
    }

}
