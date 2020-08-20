<?php
defined('BASEPATH') or exit('No direct script access allowed');

class User extends CI_Controller
{

    public function __construct()
    {
        parent::__construct();

        $this->load->model('Users_Model', 'userm');
    }

    public function index()
    {
        if (empty($this->session->userdata('sessao_user'))) {
            redirect('');
        }
        
        $data['titulo'] = 'Clone Whatsapp';
        $this->load->view('chat/index', $data);
    }

    public function auth()
    {
        if (!empty($this->session->userdata('sessao_user'))) {
            redirect('index');
        }

        $data['titulo'] = 'Autentication';
        $this->load->view('chat/auth', $data);
    }

    /**
     * Undocumented function
     *
     * @return void
     */
    public function authentication()
    {
        $email = strtoupper($this->input->post("email"));
        $email = addslashes($this->security->xss_clean($email));

        $pass  = addslashes(md5($this->security->xss_clean($this->input->post("pass"))));
        $user  = $this->userm->getUser($email, $pass);

        if ($user) {
            $this->userm->updateWork($user['id'], time());

            $this->session->set_userdata("sessao_user", $user);
            redirect('index');
        } else {
            $this->session->set_flashdata('erro_login', 'Invalid credentials!');
            redirect('');
        }
    }

    public function authfb()
    {
        require_once APPPATH . '../vendor/autoload.php';

        $fb = new Facebook\Facebook([
            'app_id'                  => APP_ID,
            'app_secret'              => APP_SECRET,
            'default_graph_version'   => GRAPH_VERSION
        ]);

        $helper      = $fb->getRedirectLoginHelper();
        $permissions = ['email']; // Optional permissions

        try {
            if (isset($_SESSION['face_access_token'])) {
                $accessToken = $_SESSION['face_access_token'];
            } else {
                $accessToken = $helper->getAccessToken();
            }
        } catch (Facebook\Exceptions\FacebookResponseException $e) {
            echo 'Graph returned an error: ' . $e->getMessage();
            exit;
        } catch (Facebook\Exceptions\FacebookSDKException $e) {
            echo 'Facebook SDK returned an error: ' . $e->getMessage();
            exit;
        }

        if (!isset($accessToken)) {
            $redirect  = $helper->getLoginUrl(base_url('authfb'), $permissions);
            header("Location: $redirect");
        } else {
            $redirect  = $helper->getLoginUrl(base_url('authfb'), $permissions);
            
            if (isset($_SESSION['face_access_token'])){
                $fb->setDefaultAccessToken($_SESSION['face_access_token']);
            } else {
                $_SESSION['face_access_token'] = (string) $accessToken;
                $oAuth2Client                  = $fb->getOAuth2Client();
                $_SESSION['face_access_token'] = (string) $oAuth2Client->getLongLivedAccessToken($_SESSION['face_access_token']);
                $fb->setDefaultAccessToken($_SESSION['face_access_token']);	
            }
            
            try {
                $response   = $fb->get('/me?fields=name, picture, email');
                $user       = $response->getGraphUser();
                $resultUser = $this->userm->getUser($user['email'], '', true);

                if ($resultUser) {
                    $this->session->set_userdata("sessao_user", $resultUser);
                    redirect('index');
                } else {
                    $arrayUser = array(
                        'nome'   => $user['name'],
                        'email'  => $user['email'],
                        'login'  => $user['name'],
                        'senha'  => '',
                        'inicio' => 0,
                        'imagem' => $user['picture']['url']
                    );

                    $rs = $this->userm->insertUser($arrayUser);

                    if ($rs) {
                        $this->session->set_userdata("sessao_user", $arrayUser);
                        redirect('index');
                    }
                }

            } catch(Facebook\Exceptions\FacebookResponseException $e) {
                echo 'Graph returned an error: ' . $e->getMessage();
                exit;
            } catch(Facebook\Exceptions\FacebookSDKException $e) {
                echo 'Facebook SDK returned an error: ' . $e->getMessage();
                exit;
            }
        }
    }

    public function signup()
    {

        //pre($this->input->post(), true);
        
        $name  = $this->input->post("name");
        $email = $this->input->post("email");
        $email = addslashes($this->security->xss_clean($email));
        $pass  = addslashes(md5($this->security->xss_clean($this->input->post("password"))));
        
        $resultUser = $this->userm->getUser($email, '', true);

        if ($resultUser) {
            $this->session->set_flashdata('erro_login', 'Email already exists!');
            redirect('');
        } else {
            $arrayUser = array(
                'nome'   => $name,
                'email'  => $email,
                'login'  => $name,
                'senha'  => $pass,
                'inicio' => 0,
                'imagem' => ''
            );

            $rs = $this->userm->insertUser($arrayUser);

            if ($rs) {
                $this->session->set_flashdata('success', 'Registration successfully complete!');
                redirect('');
            }
        }
    }

    /**
     * Undocumented function
     *
     * @return void
     */
    public function updateWorkUser()
    {

        $sessao = $this->session->userdata('sessao_user')[0]['inicio'];

        if ($sessao['inicio']) {
            $limit = time() - $this->session->userdata('sessao_user')[0]['inicio'];

            if ($sessao['inicio'] >= $limit) {
                $this->userm->updateWork($sessao['id'], time());
            }
        }
    }

    /**
     * Undocumented function
     *
     * @return void
     */
    public function logoff()
    {
        //if ($this->userm->updateWork($this->session->userdata['sessao_user']['id'], time())) {
            $this->session->unset_userdata("sessao_user");
            redirect('');
        //}
    }
}
