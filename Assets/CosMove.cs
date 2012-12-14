using UnityEngine;
using System.Collections;

public class CosMove : MonoBehaviour
{

    public Vector3 direction = Vector3.up;
    public float speed = 0.5f;
    public float maxDistance = 10.0f;

    private Vector3 initialPosition;

    // Use this for initialization
    void Start()
    {
        initialPosition = new Vector3(transform.position.x, transform.position.y, transform.position.z);
    }

    // Update is called once per frame
    void Update()
    {
        transform.position = initialPosition + direction * maxDistance * Mathf.Cos(speed * Time.timeSinceLevelLoad);  
    }
}
