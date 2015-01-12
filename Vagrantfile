# Lets Chat Vagrant file
$LCB_SCRIPT = <<EOF
sudo apt-get update
sudo apt-get install -y python-software-properties
sudo apt-add-repository -y ppa:chris-lea/node.js
sudo apt-get update
sudo apt-get install -y mongodb build-essential nodejs git libkrb5-dev
git clone https://github.com/sdelements/lets-chat.git
cd lets-chat
git checkout release/0.3.0
npm install
cp settings.yml.sample settings.yml
nodejs app.js
EOF

VAGRANTFILE_API_VERSION = "2"

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
  config.vm.box = "precise32"
  config.vm.box_url = "http://files.vagrantup.com/precise32.box"

  config.vm.define :lcb do |lcb|
      lcb.vm.network "forwarded_port", guest: 5000, host: 5000
      lcb.vm.provision :shell, :inline => $LCB_SCRIPT, :privileged => false
  end
  
  config.vm.provider "virtualbox" do |v|
      v.gui = true
      v.name = "Lets Chat"
      v.memory = 1024
  end
end
