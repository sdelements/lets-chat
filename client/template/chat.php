<?php $this->load('header'); ?>
	<div class="full-span-side">
		<div id="sidebar">
			<div class="inner">
				<h1>Development</h1>
				<p>Peace, love, and eternal brogramming.</p>
				<div class="clear">
					<div class="btn-group buttons">
						<a class="btn" href="#">
							<i class="icon-comment"></i>
						</a>
						<a class="btn" href="#">
							<i class="icon-eye-close"></i>
						</a>
						<a class="btn" href="#">
							<i class="icon-cog"></i>
						</a>
					</div>
					<div class="volume-control btn-group" style=>
						<a class="btn btn-primary" href="#">
							<i class="icon-volume-up icon-white"></i>
						</a>
						<a class="btn btn-primary dropdown-toggle" data-toggle="dropdown" href="#">
							<span class="caret"></span>
						</a>
						<ul class="dropdown-menu">
							<li><a href="#">Volume up</a></li>
							<li><a href="#">Volume Down</a></li>
						</ul>
					</div>
				</div>
				<ul id="user-list"></ul>
				<div style="clear: both; padding-top: 10px; text-align: right;">
					<a data-toggle="modal" href="#set-name" class="btn btn-danger">Set Username</a>
				</div>
				<div id="status">
					<div class="inner">
						<span class="message"></span>
						<span class="ping"></span>
					</div>
				</div>
			</div>
		</div><!-- sidebar end -->
	</div><!-- full-span-side end -->
	<div class="full-span-main">
		<div id="chat">
			<ul class="messages">
				<!-- <li class="message talk">
					<div class="name">Houssam</div>
					<div class="text">
						<div class="bubble">
							You should be able to delete stuff that shows up on multiple pages. We know how fix that, we do it on the project edit page.
						</div>
					</div>
				</li>
				<li class="message event">
					<div class="name">Pratik</div>
					<div class="text">
						has entered the building
					</div>
				</li> -->
			</ul>
			<div id="entry" class="entry full-span-main">
				<div class="inner">
					<textarea></textarea>
					<div class="buttons">
						<button class="send btn btn-success">Send</button>
					</div>
				</div>
			</div>
		</div><!-- chat end -->
	</div><!-- full-span-view end -->

<?php $this->load('footer'); ?>