# Lets Chat Vagrant file

# Set LCB_BRANCH to pick what git checkout to use when spinning up the
# application. For example:
#
# $ LCB_BRANCH="feature-branch vagrant up.
#
LCB_BRANCH = ENV['LCB_BRANCH'] || 'master'


# Script that we run to bootstrap the system to run Let's Chat
LCB_SCRIPT = <<EOF
sudo apt-get update
sudo apt-get install -y python-software-properties
sudo apt-add-repository -y ppa:chris-lea/node.js
sudo apt-get update
sudo apt-get install -y mongodb build-essential nodejs git
git clone https://github.com/sdelements/lets-chat.git
cd lets-chat
git checkout #{LCB_BRANCH}
npm install
cp settings.yml.sample settings.yml
LCB_HTTP_HOST=0.0.0.0 npm start
EOF


VAGRANTFILE_API_VERSION = "2"

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
  config.vm.box = "precise32"
  config.vm.box_url = "http://files.vagrantup.com/precise32.box"

  config.vm.define :lcb do |lcb|
      lcb.vm.network "forwarded_port", guest: 5000, host: 5000
      lcb.vm.network "forwarded_port", guest: 5222, host: 5222
      lcb.vm.provision :shell, :inline => LCB_SCRIPT, :privileged => false
  end

  config.vm.provider "virtualbox" do |v|
      v.gui = true
      v.name = "Lets Chat"
      v.memory = 1024
  end
end
